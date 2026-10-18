"use client";

import { useMemo, useState } from "react";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { formatClp, parseClpInput, registeredBudgetClp } from "@/lib/evm";
import {
  INDIVIDUAL_KICKOFF_QUESTIONS,
  addCalendarDays,
  canEditPmNotes,
  canEditSoldExtract,
  commercialDeliveryReady,
  defaultWorkingAgreement,
  draftFinalProposal,
  emptyProposal,
  evaluateInternalGate,
} from "@/lib/kickoff";
import { KickoffAreaPanel } from "@/components/onboarding/KickoffAreaPanel";
import { IndividualInternalKickoff } from "@/components/onboarding/IndividualInternalKickoff";
import type { Client, KickoffProposal, OrgArea, Project, ProjectKickoff } from "@/lib/types";

type Step = "client" | "project" | "internal" | "clientKickoff";

export function ClientKickoffAssistant({
  onStarted,
  onCancel,
  resumeProjectId,
}: {
  onStarted: (projectId: string) => void;
  onCancel?: () => void;
  resumeProjectId?: string;
}) {
  const {
    clients,
    projects,
    areas,
    users,
    addClient,
    addClientProject,
    updateClientProject,
    saveKickoff,
    stampCommercialKickoff,
    confirmInternalKickoff,
    openClientKickoff,
    confirmClientKickoff,
    activateProject,
    kickoffFor,
    sessionUser,
    ownerManagesAll,
    isIndividualMode,
  } = useOrg();

  const resumed = resumeProjectId ? projects.find((item) => item.id === resumeProjectId) : undefined;
  const resumedClient = resumed ? clients.find((item) => item.id === resumed.clientId) : undefined;
  const resumedKickoff = resumeProjectId ? kickoffFor(resumeProjectId) : undefined;

  const initialStep: Step = resumed
    ? registeredBudgetClp(resumed) <= 0
      ? "project"
      : resumed.kickoffPhase === "internal_done" || resumed.kickoffPhase === "client_done"
        ? "clientKickoff"
        : "internal"
    : "client";

  const [step, setStep] = useState<Step>(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(resumed?.clientId ?? "");
  const [projectId, setProjectId] = useState(resumed?.id ?? "");
  const [clientName, setClientName] = useState(resumedClient?.name ?? "");
  const [clientRut, setClientRut] = useState(resumedClient?.rut ?? "");
  const [contactName, setContactName] = useState(resumedClient?.contactName ?? "");
  const [contactEmail, setContactEmail] = useState(resumedClient?.contactEmail ?? "");
  const [projectName, setProjectName] = useState(resumed?.name ?? "");
  const [projectCode, setProjectCode] = useState(resumed?.code ?? "");
  const [startDate, setStartDate] = useState(resumed?.startDate ?? "");
  const [finishDate, setFinishDate] = useState(resumed?.finishDate ?? "");
  const [initialBudget, setInitialBudget] = useState(() => {
    const amount = resumed ? registeredBudgetClp(resumed) : 0;
    return amount > 0 ? String(amount) : "";
  });
  const [draft, setDraft] = useState<Partial<ProjectKickoff>>(() => seedDraft(resumedKickoff, resumed, areas));

  const currentProject: Project | undefined = projects.find((item) => item.id === projectId);
  const currentClient: Client | undefined = clients.find((item) => item.id === clientId);
  const storedKickoff = kickoffFor(projectId);
  const merged = {
    ...storedKickoff,
    ...draft,
    areaReviews: storedKickoff?.areaReviews ?? draft.areaReviews ?? [],
    proposal: draft.proposal?.fileName || draft.proposal?.body ? { ...emptyProposal(), ...storedKickoff?.proposal, ...draft.proposal } : storedKickoff?.proposal ?? emptyProposal(),
  } as ProjectKickoff;
  const commercialDone = Boolean(merged.commercialDeliveredAt);
  const pmDone = Boolean(merged.pmValidatedAt);
  const clientLocked = Boolean(merged.clientConfirmedAt);
  const gate = evaluateInternalGate(merged, areas, isIndividualMode);
  const canStampCommercial = canEditSoldExtract(sessionUser, users, ownerManagesAll);
  const canEditPm = canEditPmNotes(sessionUser, users, ownerManagesAll);

  const steps = useMemo(
    () => [
      { id: "client" as const, label: "Cliente" },
      { id: "project" as const, label: "Proyecto" },
      { id: "internal" as const, label: "Kickoff interno" },
      { id: "clientKickoff" as const, label: "Kickoff cliente" },
    ],
    [],
  );

  function patchDraft(next: Partial<ProjectKickoff>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function patchProposal(next: Partial<KickoffProposal>) {
    const proposal = {
      ...emptyProposal(),
      ...merged.proposal,
      ...next,
    };
    patchDraft({ proposal });
    if (projectId) {
      saveKickoff(projectId, {
        proposal,
        commercialCommitment: draft.commercialCommitment?.trim() || proposal.body.trim(),
      });
    }
  }

  function onProposalFile(file: File) {
    patchProposal({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      title: merged.proposal?.title || file.name.replace(/\.[^.]+$/, ""),
      uploadedBy: sessionUser.id,
      uploadedAt: new Date().toISOString(),
    });
    if (file.type.startsWith("text/") || /\.(md|txt|csv)$/i.test(file.name)) {
      void file.text().then((text) => patchProposal({ body: text }));
    }
  }

  function personName(userId: string) {
    const person = users.find((item) => item.id === userId);
    return person ? `${person.name || person.email} · ${ROLE_LABELS[person.role]}` : "Registrado";
  }

  function submitClient() {
    if (!clientName.trim() || !clientRut.trim()) {
      setError("La razón social y el RUT del cliente son obligatorios.");
      return;
    }
    const id =
      clientId ||
      addClient({
        name: clientName,
        rut: clientRut,
        contactName,
        contactEmail,
      });
    setClientId(id);
    setError(null);
    setStep("project");
  }

  function ensureProject() {
    if (!clientId) {
      setError("Completa el cliente antes de crear el proyecto.");
      return "";
    }
    if (!projectName.trim() || !projectCode.trim() || !startDate || !finishDate) {
      setError("Completa nombre, código, inicio y término del proyecto.");
      return "";
    }
    if (finishDate < startDate) {
      setError("El término no puede ser anterior al inicio.");
      return "";
    }
    const amount = parseClpInput(initialBudget) || (currentProject ? registeredBudgetClp(currentProject) : 0);
    if (!(amount > 0)) {
      setError("Registra el presupuesto inicial en la fase Proyecto. Sin ese monto no se arma el cronograma.");
      setStep("project");
      return "";
    }
    if (projectId) {
      const ok = updateClientProject(projectId, {
        name: projectName,
        code: projectCode,
        startDate,
        finishDate,
        proposedBac: amount,
      });
      if (!ok) {
        setError("No se pudo actualizar el proyecto.");
        return "";
      }
      return projectId;
    }
    const id = addClientProject(clientId, {
      name: projectName,
      code: projectCode,
      startDate,
      finishDate,
      proposedBac: amount,
    });
    if (!id) {
      setError("No se pudo crear el proyecto. Revisa el cliente.");
      return "";
    }
    return id;
  }

  function submitProject() {
    const id = ensureProject();
    if (!id) return;
    setProjectId(id);
    patchDraft({
      soldStartDate: draft.soldStartDate || startDate,
      soldFinishDate: draft.soldFinishDate || finishDate,
      plannedStartDate: draft.plannedStartDate || startDate,
      plannedFinishDate: draft.plannedFinishDate || finishDate,
      workingAgreement: draft.workingAgreement || defaultWorkingAgreement(areas),
    });
    saveKickoff(id, {
      workingAgreement: draft.workingAgreement || defaultWorkingAgreement(areas),
      soldStartDate: startDate,
      soldFinishDate: finishDate,
      plannedStartDate: startDate,
      plannedFinishDate: finishDate,
    });
    setError(null);
    setStep("internal");
  }

  function persistConsultation(next: Partial<ProjectKickoff>) {
    const patch = { ...next };
    const consultation = patch.internalDate ?? draft.internalDate ?? merged.internalDate;
    const due = patch.clientKickoffDueDate ?? draft.clientKickoffDueDate ?? merged.clientKickoffDueDate;
    if (consultation && !due) {
      patch.clientKickoffDueDate = addCalendarDays(consultation, 7);
    }
    patchDraft(patch);
    if (projectId) saveKickoff(projectId, patch);
  }

  function persistPmNotes(next: Partial<ProjectKickoff>) {
    patchDraft(next);
    if (projectId) saveKickoff(projectId, next);
  }

  function deliverCommercial() {
    if (!projectId) return;
    if (!canStampCommercial) {
      setError("El extracto lo registran el administrador o el gestor de proyectos. No hace falta un área comercial.");
      return;
    }
    const payload = { ...kickoffFor(projectId), ...draft } as ProjectKickoff;
    if (!commercialDeliveryReady(payload)) {
      setError("Escribe el extracto de la propuesta. Las fechas del proyecto alcanzan para registrarla.");
      return;
    }
    const ok = stampCommercialKickoff(projectId, draft, sessionUser.id);
    if (!ok) {
      setError("Escribe el extracto de la propuesta. Las fechas del proyecto alcanzan para registrarla.");
      return;
    }
    patchDraft({
      commercialDeliveredBy: sessionUser.id,
      commercialDeliveredAt: new Date().toISOString(),
    });
    setError(null);
  }

  function confirmIndividualInternal() {
    if (!projectId) return;
    const stored = kickoffFor(projectId);
    const payload = {
      ...stored,
      ...draft,
      areaReviews: stored?.areaReviews ?? [],
      proposal: stored?.proposal ?? draft.proposal,
      internalEvalAnswers: {
        ...(stored?.internalEvalAnswers ?? {}),
        ...(draft.internalEvalAnswers ?? {}),
      },
      internalNotes: draft.internalNotes ?? stored?.internalNotes ?? "",
      finalProposalToClient:
        draft.finalProposalToClient?.trim() ||
        draft.proposal?.body?.trim() ||
        draft.commercialCommitment?.trim() ||
        "",
    } as ProjectKickoff;
    if (!commercialDone) {
      const stamped = stampCommercialKickoff(projectId, payload, sessionUser.id);
      if (!stamped) {
        setError("Escribe el alcance de lo vendido. Las fechas del proyecto alcanzan para registrarlo.");
        return;
      }
    }
    const ok = confirmInternalKickoff(projectId, payload, sessionUser.id);
    if (!ok) {
      setError("Completá la propuesta, las notas para el cliente y las preguntas PMBOK.");
      return;
    }
    patchDraft({
      commercialDeliveredBy: sessionUser.id,
      commercialDeliveredAt: new Date().toISOString(),
      pmValidatedBy: sessionUser.id,
      pmValidatedAt: new Date().toISOString(),
      internalConfirmedAt: new Date().toISOString(),
    });
    setError(null);
  }

  function goToClientKickoff() {
    if (!gate.canMeetClient) {
      setError(
        gate.reasons[0] ||
          (isIndividualMode
            ? "Cerrá el kickoff interno (propuesta, notas y criterio PMBOK) antes de ir con el cliente."
            : "Registra el extracto, la fecha de consulta y el plazo del kickoff con el cliente para continuar."),
      );
      return;
    }
    if (!isIndividualMode && projectId) {
      const payload = {
        ...draft,
        finalProposalToClient: draft.finalProposalToClient?.trim() || draftFinalProposal(merged),
        clientDate: draft.clientDate || draft.clientKickoffDueDate,
      };
      const opened = openClientKickoff(projectId, payload, sessionUser.id);
      if (!opened) {
        setError("No se pudo abrir el kickoff con el cliente. Revisa el extracto y las fechas de consulta.");
        return;
      }
      patchDraft({
        commercialDeliveredBy: merged.commercialDeliveredBy || sessionUser.id,
        commercialDeliveredAt: merged.commercialDeliveredAt || new Date().toISOString(),
        clientDate: payload.clientDate,
        finalProposalToClient: payload.finalProposalToClient,
      });
    }
    setError(null);
    setStep("clientKickoff");
  }

  function submitClientKickoff() {
    if (!projectId) return;
    saveKickoff(projectId, draft);
    const ok = confirmClientKickoff(projectId, draft);
    if (!ok) {
      setError("Registra los acuerdos con el cliente para dejar el kickoff cerrado. Si la obra ya está en curso, puedes saltar al cronograma.");
      return;
    }
    onStarted(projectId);
  }

  function skipKickoffToSchedule() {
    if (step === "client") {
      setError("Registra el cliente y el proyecto, con su presupuesto inicial. El kickoff se puede saltar en el paso siguiente.");
      return;
    }
    const id = ensureProject();
    if (!id) return;
    setProjectId(id);
    const ok = activateProject(id);
    if (!ok) {
      setError("No se pudo abrir el cronograma.");
      return;
    }
    setError(null);
    onStarted(id);
  }

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-4 gap-1 text-[11px] sm:text-xs">
        {steps.map((item, index) => {
          const active = step === item.id;
          const done = steps.findIndex((entry) => entry.id === step) > index;
          return (
            <li
              key={item.id}
              className={`rounded-lg px-2 py-2 ${
                active
                  ? "bg-[var(--brand)] font-semibold text-white"
                  : done
                    ? "bg-emerald-50 text-emerald-900"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {index + 1}. {item.label}
            </li>
          );
        })}
      </ol>

      {currentClient && step !== "client" ? (
        <p className="text-sm text-slate-600">
          Cliente: <strong>{currentClient.name}</strong>
          {currentClient.rut ? ` · RUT ${currentClient.rut}` : ""}
          {currentProject ? ` · ${currentProject.name}` : ""}
        </p>
      ) : null}

      {step === "client" ? (
        <ClientFields
          clients={clients}
          resumed={Boolean(resumed)}
          clientName={clientName}
          clientRut={clientRut}
          contactName={contactName}
          contactEmail={contactEmail}
          onPick={(selected) => {
            setClientId(selected.id);
            setClientName(selected.name);
            setClientRut(selected.rut);
            setContactName(selected.contactName);
            setContactEmail(selected.contactEmail);
          }}
          onName={setClientName}
          onRut={setClientRut}
          onContactName={setContactName}
          onContactEmail={setContactEmail}
        />
      ) : null}

      {step === "project" ? (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Proyecto del cliente</h2>
            <p className="mt-1 text-sm text-slate-600">
              Identificación de la obra y presupuesto inicial. El cronograma de ejemplo se arma con ese monto.
              El kickoff interno y el del cliente son opcionales: si la obra ya está en curso, puedes saltarlos.
            </p>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nombre del proyecto</span>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Mejoramiento Ruta 5 — Tramo Talca"
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Código</span>
            <input
              value={projectCode}
              onChange={(event) => setProjectCode(event.target.value)}
              placeholder="OBRA-01"
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Inicio previsto</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Término previsto</span>
              <input
                type="date"
                value={finishDate}
                min={startDate}
                onChange={(event) => setFinishDate(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Presupuesto inicial (CLP)</span>
            <input
              type="text"
              inputMode="numeric"
              value={initialBudget}
              onChange={(event) => setInitialBudget(event.target.value)}
              placeholder="Ej. 450000000"
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
            <span className="mt-1 block text-xs text-slate-500">
              {parseClpInput(initialBudget) > 0
                ? `Queda registrado ${formatClp(parseClpInput(initialBudget))} para armar el cronograma. Finanzas puede formalizarlo después.`
                : "Obligatorio para ver el cronograma si saltas el kickoff. Es el BAC inicial de la obra, no la clave SII."}
            </span>
          </label>
        </div>
      ) : null}

      {step === "internal" && isIndividualMode ? (
        <IndividualInternalKickoff
          draft={draft}
          commercialDone={commercialDone}
          internalDone={pmDone}
          onPatch={(next) => {
            patchDraft(next);
            if (projectId) saveKickoff(projectId, next);
          }}
          onProposal={patchProposal}
          onProposalFile={onProposalFile}
          onRegisterProposal={deliverCommercial}
          onConfirmInternal={confirmIndividualInternal}
        />
      ) : null}

      {step === "internal" && !isIndividualMode ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Kickoff interno</h2>
            <p className="mt-1 text-sm text-slate-600">
              El administrador o el gestor registran el extracto. No hace falta un área comercial. Las demás áreas
              pueden comentar. Este paso es opcional si estás migrando una obra en curso.
            </p>
          </div>

          <section className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3">
            <h3 className="font-semibold">1. Extracto de lo vendido</h3>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Extracto que comentan las áreas</span>
              <textarea
                rows={4}
                value={draft.proposal?.body ?? ""}
                disabled={clientLocked || !canStampCommercial}
                onChange={(event) => patchProposal({ body: event.target.value, title: draft.proposal?.title || "Propuesta inicial" })}
                placeholder="Alcance, plazos, supuestos y exclusiones. Con este texto ya se puede comentar."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-50"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Documento (opcional)</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,application/pdf"
                disabled={clientLocked || !canStampCommercial}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onProposalFile(file);
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50"
              />
              {draft.proposal?.fileName ? (
                <span className="mt-1 block text-xs text-slate-600">Adjunto: {draft.proposal.fileName}</span>
              ) : null}
            </label>
            {canStampCommercial && !clientLocked ? (
              <button
                type="button"
                onClick={deliverCommercial}
                className="rounded-md bg-sky-800 px-3 py-2 text-sm text-white hover:bg-sky-900"
              >
                {commercialDone ? "Actualizar extracto" : "Registrar propuesta"}
              </button>
            ) : null}
            {commercialDone ? (
              <p className="text-xs font-medium text-emerald-800">
                Extracto registrado · {personName(merged.commercialDeliveredBy)}. Se puede seguir editando hasta el
                kickoff con el cliente.
              </p>
            ) : canStampCommercial ? null : (
              <p className="text-xs text-slate-600">
                El extracto lo registran el administrador o el gestor de proyectos. No hace falta un área comercial.
              </p>
            )}
          </section>

          {projectId ? <KickoffAreaPanel projectId={projectId} kickoff={merged} /> : null}

          <details className="rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold">Datos de contrato (opcional)</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Inicio de ejecución</span>
                <input
                  type="date"
                  value={draft.plannedStartDate ?? ""}
                  onChange={(event) => patchDraft({ plannedStartDate: event.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Término de ejecución</span>
                <input
                  type="date"
                  value={draft.plannedFinishDate ?? ""}
                  min={draft.plannedStartDate}
                  onChange={(event) => patchDraft({ plannedFinishDate: event.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Inicio en faena</span>
                <input
                  type="date"
                  value={draft.siteStartDate ?? ""}
                  onChange={(event) => patchDraft({ siteStartDate: event.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <label className="mt-3 block text-sm">
              <span className="mb-1 block font-medium">Aspectos legales / garantías / permisos</span>
              <textarea
                rows={2}
                value={[draft.legalAspects, draft.contractType, draft.guarantees, draft.permits].filter(Boolean).join(" · ")}
                onChange={(event) => patchDraft({ legalAspects: event.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
          </details>

          <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
            <h3 className="font-semibold">3. Consulta del gestor</h3>
            <p className="text-xs text-slate-600">
              El gestor comenta y edita, pero no cierra el flujo. Con extracto, fecha de consulta y plazo al cliente
              se continúa al kickoff con el cliente.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Fecha de consulta</span>
                <input
                  type="date"
                  value={draft.internalDate ?? ""}
                  disabled={!canEditPm || clientLocked}
                  onChange={(event) => persistConsultation({ internalDate: event.target.value })}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-50"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Plazo del kickoff con el cliente</span>
                <input
                  type="date"
                  value={draft.clientKickoffDueDate ?? ""}
                  min={draft.internalDate}
                  disabled={!canEditPm || clientLocked}
                  onChange={(event) => persistConsultation({ clientKickoffDueDate: event.target.value })}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-50"
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Comentarios del gestor</span>
              <textarea
                rows={3}
                value={draft.internalNotes ?? ""}
                disabled={!canEditPm || clientLocked}
                onChange={(event) => persistPmNotes({ internalNotes: event.target.value })}
                placeholder="Qué se compromete según los comentarios de las áreas. No cierra el flujo."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-50"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Registro de lo comprometido para el cliente</span>
              <textarea
                rows={3}
                value={draft.finalProposalToClient ?? ""}
                disabled={!canEditPm || clientLocked}
                onChange={(event) => persistPmNotes({ finalProposalToClient: event.target.value })}
                onFocus={() => {
                  if (!draft.finalProposalToClient?.trim()) {
                    persistPmNotes({ finalProposalToClient: draftFinalProposal(merged) });
                  }
                }}
                placeholder="Se arma con el extracto y los comentarios de las áreas. Se puede editar."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-50"
              />
            </label>
            {canEditPm ? (
              <p className="text-xs text-amber-950">
                Los comentarios del gestor quedan en el expediente. No hay que confirmar para continuar.
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                El gestor o el administrador registran la fecha de consulta y los comentarios.
              </p>
            )}
          </section>

          {gate.canMeetClient ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
              Extracto y plazo listos. Puedes continuar al kickoff con el cliente o saltar al cronograma si la
              obra ya está en curso.
            </p>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {(gate.reasons.find((item) => !item.startsWith("Comentarios aún")) ||
                "Para el kickoff interno registra el extracto, la fecha de consulta y el plazo con el cliente.") +
                " Si la obra ya está en desarrollo, puedes saltarlo e ir al cronograma."}
            </p>
          )}
        </div>
      ) : null}

      {step === "clientKickoff" ? (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Kickoff con el cliente</h2>
            <p className="mt-1 text-sm text-slate-600">
              Opcional. El administrador o el gestor registran los acuerdos con el cliente. El cronograma ya se
              puede usar si saltaste el kickoff para migrar una obra en curso.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium">Registro interno</p>
            <p className="mt-1">
              Extracto: {merged.commercialDeliveredAt ? personName(merged.commercialDeliveredBy) : "—"}
            </p>
            {!isIndividualMode ? (
              <p>
                Consulta: {draft.internalDate || "—"} · Plazo kickoff cliente: {draft.clientKickoffDueDate || "—"}
              </p>
            ) : (
              <p>
                Gestor: {merged.pmValidatedAt ? personName(merged.pmValidatedBy) : "—"}
              </p>
            )}
            <p className="mt-2 whitespace-pre-wrap">{draft.finalProposalToClient || draft.commercialCommitment}</p>
            {draft.internalNotes ? (
              <p className="mt-2 whitespace-pre-wrap">
                <span className="font-medium">
                  {isIndividualMode ? "Notas para validar con el cliente: " : "Comentarios del gestor: "}
                </span>
                {draft.internalNotes}
              </p>
            ) : null}
            {isIndividualMode
              ? INDIVIDUAL_KICKOFF_QUESTIONS.map((item) => {
                  const answer = draft.internalEvalAnswers?.[item.id]?.trim();
                  if (!answer) return null;
                  return (
                    <p key={item.id} className="mt-2 whitespace-pre-wrap">
                      <span className="font-medium">{item.knowledgeArea}: </span>
                      {answer}
                    </p>
                  );
                })
              : null}
            {!isIndividualMode && merged.areaReviews?.length ? (
              <div className="mt-2">
                <p className="font-medium">Comentarios de las áreas</p>
                {merged.areaReviews.map((item) => (
                  <p key={item.id} className="mt-1 whitespace-pre-wrap">
                    {item.areaName}: {item.comment}
                  </p>
                ))}
              </div>
            ) : null}
            {draft.pmFulfillmentPlan ? (
              <p className="mt-2">
                <span className="font-medium">Plan de cumplimiento: </span>
                {draft.pmFulfillmentPlan}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Fecha con el cliente</span>
              <input
                type="date"
                value={draft.clientDate ?? ""}
                onChange={(event) => patchDraft({ clientDate: event.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Asistentes</span>
              <input
                value={draft.clientAttendees ?? ""}
                onChange={(event) => patchDraft({ clientAttendees: event.target.value })}
                placeholder="Nombres en la reunión"
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Acuerdos con el cliente</span>
            <textarea
              rows={4}
              value={draft.clientAgreements ?? ""}
              onChange={(event) => patchDraft({ clientAgreements: event.target.value })}
              placeholder="Qué se confirmó: alcance, fechas de inicio, hitos, comunicaciones."
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            if (step === "client") onCancel?.();
            else if (step === "project") setStep("client");
            else if (step === "internal") setStep("project");
            else setStep("internal");
          }}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          {step === "client" ? (onCancel ? "Volver al listado" : "Más tarde") : "Atrás"}
        </button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {step !== "client" ? (
            <button
              type="button"
              onClick={skipKickoffToSchedule}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Saltar kickoff e ir al cronograma
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (step === "client") submitClient();
              else if (step === "project") submitProject();
              else if (step === "internal") goToClientKickoff();
              else submitClientKickoff();
            }}
            disabled={step === "internal" && !gate.canMeetClient}
            className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand-dark)] disabled:opacity-40"
          >
            {step === "clientKickoff"
              ? "Registrar kickoff con el cliente"
              : step === "internal"
                ? "Continuar al kickoff con el cliente"
                : step === "project"
                  ? "Continuar al kickoff (opcional)"
                  : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function seedDraft(
  resumedKickoff: ProjectKickoff | undefined,
  resumed: Project | undefined,
  areas: OrgArea[],
): Partial<ProjectKickoff> {
  return {
    commercialCommitment: resumedKickoff?.commercialCommitment ?? "",
    commercialConditions: resumedKickoff?.commercialConditions ?? "",
    exclusions: resumedKickoff?.exclusions ?? "",
    requirements: resumedKickoff?.requirements ?? "",
    soldStartDate: resumedKickoff?.soldStartDate || resumed?.startDate || "",
    soldFinishDate: resumedKickoff?.soldFinishDate || resumed?.finishDate || "",
    commercialDeliveredBy: resumedKickoff?.commercialDeliveredBy ?? "",
    commercialDeliveredAt: resumedKickoff?.commercialDeliveredAt ?? null,
    proposal: resumedKickoff?.proposal ?? emptyProposal(),
    areaReviews: resumedKickoff?.areaReviews ?? [],
    finalProposalToClient: resumedKickoff?.finalProposalToClient ?? "",
    plannedStartDate: resumedKickoff?.plannedStartDate || resumed?.startDate || "",
    plannedFinishDate: resumedKickoff?.plannedFinishDate || resumed?.finishDate || "",
    siteStartDate: resumedKickoff?.siteStartDate ?? "",
    legalAspects: resumedKickoff?.legalAspects ?? "",
    contractType: resumedKickoff?.contractType ?? "",
    guarantees: resumedKickoff?.guarantees ?? "",
    permits: resumedKickoff?.permits ?? "",
    workingAgreement: resumedKickoff?.workingAgreement || defaultWorkingAgreement(areas),
    internalEvalAnswers: resumedKickoff?.internalEvalAnswers ?? {},
    internalDate: resumedKickoff?.internalDate ?? "",
    clientKickoffDueDate: resumedKickoff?.clientKickoffDueDate ?? "",
    internalNotes: resumedKickoff?.internalNotes ?? "",
    pmFit: resumedKickoff?.pmFit ?? "",
    pmJudgment: resumedKickoff?.pmJudgment ?? "",
    pmFulfillmentPlan: resumedKickoff?.pmFulfillmentPlan ?? "",
    pmValidatedBy: resumedKickoff?.pmValidatedBy ?? "",
    pmValidatedAt: resumedKickoff?.pmValidatedAt ?? null,
    clientDate: resumedKickoff?.clientDate ?? "",
    clientAttendees: resumedKickoff?.clientAttendees ?? "",
    clientAgreements: resumedKickoff?.clientAgreements ?? "",
  };
}

function ClientFields({
  clients,
  resumed,
  clientName,
  clientRut,
  contactName,
  contactEmail,
  onPick,
  onName,
  onRut,
  onContactName,
  onContactEmail,
}: {
  clients: Client[];
  resumed: boolean;
  clientName: string;
  clientRut: string;
  contactName: string;
  contactEmail: string;
  onPick: (client: Client) => void;
  onName: (value: string) => void;
  onRut: (value: string) => void;
  onContactName: (value: string) => void;
  onContactEmail: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Registrar cliente</h2>
        <p className="mt-1 text-sm text-slate-600">
          Razón social y RUT. Con eso se abre la carpeta del cliente para colgarle proyectos.
        </p>
      </div>
      {clients.length && !resumed ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">O usar un cliente ya registrado</span>
          <select
            value=""
            onChange={(event) => {
              const selected = clients.find((item) => item.id === event.target.value);
              if (selected) onPick(selected);
            }}
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          >
            <option value="">Nuevo cliente</option>
            {clients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.rut}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Razón social</span>
        <input
          value={clientName}
          onChange={(event) => onName(event.target.value)}
          placeholder="Cliente SpA"
          className="w-full rounded-md border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">RUT</span>
        <input
          value={clientRut}
          onChange={(event) => onRut(event.target.value)}
          placeholder="76.123.456-7"
          className="w-full rounded-md border border-slate-200 px-3 py-2"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Contacto (opcional)</span>
          <input
            value={contactName}
            onChange={(event) => onContactName(event.target.value)}
            placeholder="Nombre en el cliente"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Correo (opcional)</span>
          <input
            type="email"
            value={contactEmail}
            onChange={(event) => onContactEmail(event.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
      </div>
    </div>
  );
}
