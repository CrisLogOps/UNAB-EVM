"use client";

import { useMemo, useRef, useState } from "react";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { formatClp, parseClpInput, registeredBudgetClp } from "@/lib/evm";
import {
  INDIVIDUAL_KICKOFF_QUESTIONS,
  addCalendarDays,
  antecedentsReady,
  canEditPmNotes,
  canEditSoldExtract,
  commercialDeliveryReady,
  defaultWorkingAgreement,
  draftFinalProposal,
  emptyProposal,
  evaluateInternalGate,
} from "@/lib/kickoff";
import { appChannel } from "@/lib/operating-mode";
import { datesForCadence, PAYMENT_CADENCES } from "@/lib/payment-cuts";
import { isPdfFile, saveProposalFile, saveScheduleFile } from "@/lib/proposal-file";
import { downloadBlob, shiftTemplateRows } from "@/lib/schedule-csv";
import { buildCombinedScheduleFile, parseScheduleUpload } from "@/lib/schedule-workbook";
import { AntecedentPreview, AntecedentsStep } from "@/components/onboarding/AntecedentsStep";
import { KickoffAreaPanel } from "@/components/onboarding/KickoffAreaPanel";
import { IndividualInternalKickoff } from "@/components/onboarding/IndividualInternalKickoff";
import type { Client, KickoffProposal, OrgArea, PaymentCadence, Project, ProjectKickoff } from "@/lib/types";

type Step = "client" | "project" | "antecedentes" | "internal" | "clientKickoff";

export function ClientKickoffAssistant({
  onStarted,
  onCancel,
  resumeProjectId,
  resumeClientId,
}: {
  onStarted: (projectId: string) => void;
  onCancel?: () => void;
  resumeProjectId?: string;
  resumeClientId?: string;
}) {
  const {
    clients,
    projects,
    gantt,
    areas,
    users,
    addClient,
    updateClient,
    addClientProject,
    updateClientProject,
    saveKickoff,
    importSchedule,
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
  const clientOnly = !resumed && resumeClientId ? clients.find((item) => item.id === resumeClientId) : undefined;
  const resumedClient = resumed ? clients.find((item) => item.id === resumed.clientId) : clientOnly;
  const resumedKickoff = resumeProjectId ? kickoffFor(resumeProjectId) : undefined;

  const initialStep: Step = resumed
    ? registeredBudgetClp(resumed) <= 0
      ? "project"
      : resumed.kickoffPhase === "internal_done" || resumed.kickoffPhase === "client_done"
        ? "clientKickoff"
        : antecedentsReady(resumedKickoff)
          ? "internal"
          : "antecedentes"
    : clientOnly
      ? "project"
      : "client";

  const [step, setStep] = useState<Step>(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(resumed?.clientId ?? clientOnly?.id ?? "");
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
  const pendingClientId = useRef("");

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
      { id: "antecedentes" as const, label: "Antecedentes" },
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
    if (!isPdfFile(file)) {
      setError("El documento El proyecto debe ser un PDF.");
      return;
    }
    setError(null);
    patchProposal({
      fileName: file.name,
      fileType: file.type || "application/pdf",
      fileSize: file.size,
      title: merged.proposal?.title || "El proyecto",
      uploadedBy: sessionUser.id,
      uploadedAt: new Date().toISOString(),
    });
    if (projectId) void saveProposalFile(projectId, file);
  }

  function downloadScheduleTemplate() {
    const current = projects.find((item) => item.id === projectId);
    const start = current?.startDate || startDate;
    const finish = current?.finishDate || finishDate;
    const file = buildCombinedScheduleFile(
      {
        projectName: current?.name || projectName,
        projectCode: current?.code || projectCode,
        start,
        finish,
        example: true,
        budgetClp: current ? registeredBudgetClp(current) : parseClpInput(initialBudget),
      },
      shiftTemplateRows(start, finish),
    );
    downloadBlob(file.filename, file.blob);
  }

  async function loadBaselineSchedule(file: File) {
    if (!projectId) return { ok: false, message: "Crea el proyecto antes de subir el cronograma." };
    try {
      const { rows, errors } = await parseScheduleUpload(file);
      if (!rows.length) {
        return { ok: false, message: errors[0] || "El archivo no tiene filas de cronograma." };
      }
      const count = importSchedule(rows, projectId);
      await saveScheduleFile(projectId, file);
      patchDraft({ baselineScheduleName: file.name });
      saveKickoff(projectId, { baselineScheduleName: file.name });
      return {
        ok: true,
        message: errors.length
          ? `Línea base cargada: ${count} elementos. ${errors.length} filas se omitieron.`
          : `Línea base cargada: ${count} elementos. Reemplaza el cronograma de ejemplo.`,
      };
    } catch {
      return {
        ok: false,
        message: "No se pudo leer el archivo. Usa la plantilla Excel o un CSV con las mismas columnas.",
      };
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
    const payload = {
      name: clientName,
      rut: clientRut,
      contactName,
      contactEmail,
    };
    if (clientId || pendingClientId.current) {
      updateClient(clientId || pendingClientId.current, payload);
    } else {
      const id = addClient(payload);
      pendingClientId.current = id;
      setClientId(id);
    }
    setError(null);
    setStep("project");
  }

  function resolveClientId() {
    if (clientId || pendingClientId.current) return clientId || pendingClientId.current;
    if (!clientName.trim() || !clientRut.trim()) {
      setError("La razón social y el RUT del cliente son obligatorios.");
      setStep("client");
      return "";
    }
    const id = addClient({
      name: clientName,
      rut: clientRut,
      contactName,
      contactEmail,
    });
    pendingClientId.current = id;
    setClientId(id);
    return id;
  }

  function ensureProject() {
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
    const ownerId = resolveClientId();
    if (!ownerId) return "";
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
    const id = addClientProject(ownerId, {
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
    setStep("antecedentes");
  }

  function continueAntecedents() {
    if (!projectId) return;
    const payload = { ...kickoffFor(projectId), ...draft } as ProjectKickoff;
    if (!antecedentsReady(payload)) {
      setError("Carga el documento El proyecto y escribe las condiciones del servicio vendido.");
      return;
    }
    saveKickoff(projectId, {
      proposal: payload.proposal,
      antecedentItems: draft.antecedentItems ?? [],
      commercialCommitment: payload.proposal.body.trim(),
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

  function formalizeInternal() {
    if (!projectId) return;
    const name = (draft.internalSignerName || sessionUser.name || "").trim();
    if (name.length < 3) {
      setError("Escribe el nombre de quien formaliza el kickoff interno.");
      return;
    }
    const signedAt = new Date().toISOString();
    const today = signedAt.slice(0, 10);
    const extra: Partial<ProjectKickoff> = {
      internalSignerName: name,
      internalSignedAt: signedAt,
      internalDate: draft.internalDate || today,
      clientKickoffDueDate: draft.clientKickoffDueDate || addCalendarDays(today, 7),
      internalConfirmedAt: signedAt,
    };
    patchDraft(extra);
    saveKickoff(projectId, extra);
    if (isIndividualMode) {
      confirmIndividualInternal(extra);
      return;
    }
    const payload = { ...kickoffFor(projectId), ...draft, ...extra } as ProjectKickoff;
    if (!antecedentsReady(payload)) {
      setError("Vuelve a antecedentes y carga el documento El proyecto con las condiciones del servicio.");
      return;
    }
    if (!commercialDone) {
      const stamped = stampCommercialKickoff(projectId, payload, sessionUser.id);
      if (!stamped) {
        setError("No se pudo registrar el documento. Revisa las condiciones del servicio.");
        return;
      }
      patchDraft({
        commercialDeliveredBy: sessionUser.id,
        commercialDeliveredAt: signedAt,
      });
    }
    setError(null);
  }

  function confirmIndividualInternal(extra?: Partial<ProjectKickoff>) {
    if (!projectId) return;
    const stored = kickoffFor(projectId);
    const signer = (extra?.internalSignerName || draft.internalSignerName || sessionUser.name || "").trim();
    if (signer.length < 3) {
      setError("Escribe el nombre de quien formaliza el kickoff interno.");
      return;
    }
    const payload = {
      ...stored,
      ...draft,
      ...extra,
      internalSignerName: signer,
      internalSignedAt: extra?.internalSignedAt || draft.internalSignedAt || new Date().toISOString(),
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
      internalConfirmedAt: payload.internalConfirmedAt,
      internalSignerName: payload.internalSignerName,
      internalSignedAt: payload.internalSignedAt,
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
    if (draft.paymentsAgreed == null) {
      setError("Indica si en la reunión se fijaron plazos de pago.");
      return;
    }
    const project = projects.find((item) => item.id === projectId);
    const variablePayments = appChannel() === "development";
    const cadence: PaymentCadence | "" =
      variablePayments && draft.paymentsAgreed && draft.paymentCadence ? draft.paymentCadence : "";
    let dates = (draft.paymentDates ?? []).map((item) => item.trim()).filter(Boolean);
    if (draft.paymentsAgreed && cadence) {
      const start = draft.plannedStartDate || draft.soldStartDate || project?.startDate || "";
      const finish = draft.plannedFinishDate || draft.soldFinishDate || project?.finishDate || "";
      dates = datesForCadence(start, finish, cadence);
      if (!dates.length) {
        setError("El inicio y el término de la obra no alcanzan para ese día fijo.");
        return;
      }
    } else if (draft.paymentsAgreed && dates.length === 0) {
      setError(
        variablePayments
          ? "Elige un día fijo o agrega al menos una fecha de estado de pago."
          : "Agrega al menos una fecha de estado de pago conversada con el cliente.",
      );
      return;
    }
    const payload = {
      ...draft,
      paymentCadence: cadence,
      paymentDates: draft.paymentsAgreed ? dates : [],
    };
    saveKickoff(projectId, payload);
    const ok = confirmClientKickoff(projectId, payload);
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

      {step !== "client" && (currentClient || clientName.trim()) ? (
        <p className="text-sm text-slate-600">
          Cliente: <strong>{currentClient?.name || clientName.trim()}</strong>
          {(currentClient?.rut || clientRut.trim()) ? ` · RUT ${currentClient?.rut || clientRut.trim()}` : ""}
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
              El paso siguiente carga los antecedentes mínimos antes del kickoff interno.
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

      {step === "antecedentes" && projectId ? (
        <AntecedentsStep
          projectId={projectId}
          draft={draft}
          activities={gantt.filter((item) => item.projectId === projectId)}
          scheduleExample={projects.find((item) => item.id === projectId)?.scheduleExample ?? true}
          onConditions={(body) => patchProposal({ body, title: draft.proposal?.title || "El proyecto" })}
          onFile={onProposalFile}
          onItems={(antecedentItems) => {
            patchDraft({ antecedentItems });
            saveKickoff(projectId, { antecedentItems });
          }}
          onDownloadTemplate={downloadScheduleTemplate}
          onScheduleFile={loadBaselineSchedule}
        />
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
              Coordina la gestión con los antecedentes ya cargados. Las áreas completan lo que falta para operar el
              proyecto. La firma formaliza este registro antes del kickoff con el cliente.
            </p>
          </div>

          {projectId ? (
            <AntecedentPreview
              projectId={projectId}
              fileName={draft.proposal?.fileName ?? ""}
              fileType={draft.proposal?.fileType ?? ""}
              activities={gantt.filter((item) => item.projectId === projectId)}
              items={draft.antecedentItems ?? []}
              baselineScheduleName={draft.baselineScheduleName ?? ""}
              scheduleExample={projects.find((item) => item.id === projectId)?.scheduleExample ?? false}
            />
          ) : null}

          <section className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3">
            <h3 className="font-semibold">Condiciones que comentan las áreas</h3>
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
            {draft.proposal?.fileName ? (
              <p className="text-xs text-slate-600">Documento El proyecto: {draft.proposal.fileName}</p>
            ) : (
              <p className="text-xs text-amber-800">Falta el documento. Vuelve al paso de antecedentes.</p>
            )}
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
                Los comentarios del gestor quedan en el expediente junto con los antecedentes.
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                El gestor o el administrador registran la fecha de consulta y los comentarios.
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-slate-200 p-3">
            <h3 className="font-semibold">Firma y formalización</h3>
            <p className="text-xs text-slate-600">
              Con el documento, el cronograma y las consideraciones, quien coordina deja su nombre. Esa firma habilita
              el kickoff con el cliente y el cierre de la fase 1.
            </p>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Nombre de quien formaliza</span>
              <input
                value={draft.internalSignerName ?? ""}
                onChange={(event) => patchDraft({ internalSignerName: event.target.value })}
                placeholder={sessionUser.name}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={formalizeInternal}
              disabled={Boolean(draft.internalSignedAt)}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-40"
            >
              {draft.internalSignedAt ? "Kickoff interno formalizado" : "Formalizar kickoff interno"}
            </button>
          </section>

          {gate.canMeetClient ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
              Antecedentes y firma listos. Puedes continuar al kickoff con el cliente para cerrar la fase 1.
            </p>
          ) : (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {gate.reasons.find((item) => !item.startsWith("Comentarios aún")) ||
                "Carga los antecedentes y formaliza el kickoff interno antes de ir con el cliente."}
            </p>
          )}
        </div>
      ) : null}

      {step === "clientKickoff" ? (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Kickoff con el cliente</h2>
            <p className="mt-1 text-sm text-slate-600">
              Con los antecedentes y la formalización interna, registra los acuerdos con el cliente. Eso cierra la
              fase 1.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium">Registro interno</p>
            <p className="mt-1">Documento: {draft.proposal?.fileName || "—"}</p>
            <p>
              Firma: {draft.internalSignerName || "—"}
              {draft.internalSignedAt ? ` · ${draft.internalSignedAt.slice(0, 10)}` : ""}
            </p>
            <p>
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
          <fieldset className="space-y-2 rounded-xl border border-slate-200 p-3">
            <legend className="px-1 text-sm font-medium">Plazos de pago</legend>
            <p className="text-xs text-slate-600">
              Si en esta reunión se fijan fechas, quedan como estados de pago en el tablero. Si no se fijan,
              el administrador las agrega después. El corte semanal se ve en ambos casos.
            </p>
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentsAgreed"
                  checked={draft.paymentsAgreed === true}
                  onChange={() =>
                    patchDraft({
                      paymentsAgreed: true,
                      paymentDates: draft.paymentDates?.length ? draft.paymentDates : [""],
                    })
                  }
                />
                Se fijaron plazos
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentsAgreed"
                  checked={draft.paymentsAgreed === false}
                  onChange={() => patchDraft({ paymentsAgreed: false, paymentDates: [], paymentCadence: "" })}
                />
                No se fijaron
              </label>
            </div>
            {draft.paymentsAgreed && appChannel() === "development" ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  El plazo usa un día que existe en todos los meses. No se usa el 29 ni el 30.
                </p>
                {PAYMENT_CADENCES.map((item) => (
                  <label key={item.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="paymentCadence"
                      className="mt-1"
                      checked={draft.paymentCadence === item.id}
                      onChange={() => patchDraft({ paymentCadence: item.id, paymentDates: [] })}
                    />
                    <span>
                      <span className="font-medium">{item.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-600">{item.detail}</span>
                    </span>
                  </label>
                ))}
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="paymentCadence"
                    className="mt-1"
                    checked={!draft.paymentCadence}
                    onChange={() => patchDraft({ paymentCadence: "", paymentDates: draft.paymentDates?.length ? draft.paymentDates : [""] })}
                  />
                  <span>
                    <span className="font-medium">Fechas sueltas</span>
                    <span className="mt-0.5 block text-xs text-slate-600">Una fecha distinta, fuera de esos días fijos.</span>
                  </span>
                </label>
              </div>
            ) : null}
            {draft.paymentsAgreed && !draft.paymentCadence ? (
              <div className="space-y-2">
                {(draft.paymentDates ?? [""]).map((date, index) => (
                  <label key={`pago-${index}`} className="block text-sm">
                    <span className="mb-1 block font-medium">Fecha {index + 1}</span>
                    <input
                      type="date"
                      lang="es-CL"
                      value={date}
                      onChange={(event) => {
                        const paymentDates = [...(draft.paymentDates ?? [""])];
                        paymentDates[index] = event.target.value;
                        patchDraft({ paymentDates });
                      }}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 sm:max-w-xs"
                    />
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => patchDraft({ paymentDates: [...(draft.paymentDates ?? []), ""] })}
                  className="text-sm font-medium text-[var(--brand)] underline"
                >
                  Agregar otra fecha
                </button>
              </div>
            ) : null}
            {draft.paymentsAgreed === false ? (
              <p className="text-xs text-amber-900">
                El administrador debe cargar las fechas en el tablero para marcar los estados de pago.
              </p>
            ) : null}
          </fieldset>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            if (step === "client") onCancel?.();
            else if (step === "project") setStep("client");
            else if (step === "antecedentes") setStep("project");
            else if (step === "internal") setStep("antecedentes");
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
              else if (step === "antecedentes") continueAntecedents();
              else if (step === "internal") goToClientKickoff();
              else submitClientKickoff();
            }}
            disabled={
              (step === "antecedentes" && !antecedentsReady({ proposal: draft.proposal } as ProjectKickoff)) ||
              (step === "internal" && !gate.canMeetClient)
            }
            className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand-dark)] disabled:opacity-40"
          >
            {step === "clientKickoff"
              ? "Cerrar fase 1"
              : step === "internal"
                ? "Continuar al kickoff con el cliente"
                : step === "antecedentes"
                  ? "Continuar al kickoff interno"
                  : step === "project"
                    ? "Continuar a antecedentes"
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
    antecedentItems: resumedKickoff?.antecedentItems ?? [],
    baselineScheduleName: resumedKickoff?.baselineScheduleName ?? "",
    internalSignerName: resumedKickoff?.internalSignerName ?? "",
    internalSignedAt: resumedKickoff?.internalSignedAt ?? null,
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
    paymentsAgreed: resumedKickoff?.paymentsAgreed ?? null,
    paymentNote: resumedKickoff?.paymentNote ?? "",
    paymentDates: resumedKickoff?.paymentDates ?? [],
    paymentCadence: resumedKickoff?.paymentCadence ?? "",
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
