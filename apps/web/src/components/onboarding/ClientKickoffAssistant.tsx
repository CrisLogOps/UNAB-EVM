"use client";

import { useMemo, useState } from "react";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import {
  COMMERCIAL_FIT_OPTIONS,
  commercialDeliveryReady,
  defaultWorkingAgreement,
  draftFinalProposal,
  emptyProposal,
  fitLabel,
  areaReviewsComplete,
  internalReadyForClient,
  pmReviewReady,
  proposalReady,
  evaluateInternalGate,
} from "@/lib/kickoff";
import { KickoffAreaPanel } from "@/components/onboarding/KickoffAreaPanel";
import type { Client, CommercialFit, KickoffProposal, OrgArea, Project, ProjectKickoff } from "@/lib/types";

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
    saveKickoff,
    stampCommercialKickoff,
    confirmInternalKickoff,
    confirmClientKickoff,
    kickoffFor,
    sessionUser,
  } = useOrg();

  const resumed = resumeProjectId ? projects.find((item) => item.id === resumeProjectId) : undefined;
  const resumedClient = resumed ? clients.find((item) => item.id === resumed.clientId) : undefined;
  const resumedKickoff = resumeProjectId ? kickoffFor(resumeProjectId) : undefined;

  const initialStep: Step = resumed
    ? resumed.kickoffPhase === "internal_done" || resumed.kickoffPhase === "client_done"
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
  const areasDone = areaReviewsComplete(merged, areas);
  const pmDone = Boolean(merged.pmValidatedAt);
  const bothDone = internalReadyForClient(merged, areas);
  const gate = evaluateInternalGate(merged, areas);

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

  function submitProject() {
    if (!projectName.trim() || !projectCode.trim() || !startDate || !finishDate) {
      setError("Completa nombre, código, inicio y término del proyecto.");
      return;
    }
    if (finishDate < startDate) {
      setError("El término no puede ser anterior al inicio.");
      return;
    }
    const id =
      projectId ||
      addClientProject(clientId, {
        name: projectName,
        code: projectCode,
        startDate,
        finishDate,
      });
    if (!id) {
      setError("No se pudo crear el proyecto. Revisa el cliente.");
      return;
    }
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

  function deliverCommercial() {
    if (!projectId) return;
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

  function confirmPm() {
    if (!projectId) return;
    const stored = kickoffFor(projectId);
    const payload = {
      ...stored,
      ...draft,
      areaReviews: stored?.areaReviews ?? [],
      proposal: stored?.proposal ?? draft.proposal,
      finalProposalToClient: draft.finalProposalToClient?.trim() || draftFinalProposal({ ...stored, ...draft } as ProjectKickoff),
    } as ProjectKickoff;
    if (!proposalReady(payload.proposal)) {
      setError("Escribe el extracto de la propuesta para que las áreas puedan comentar.");
      return;
    }
    if (!areasDone) {
      setError("Todas las áreas involucradas deben dejar por escrito las razones que justifican el proyecto.");
      return;
    }
    if (!gate.canCloseInternal) {
      setError(gate.reasons[0] || "El criterio crítico de las áreas aún no permite cerrar el kickoff interno.");
      return;
    }
    if (!pmReviewReady(payload)) {
      setError(
        "El gestor registra el juicio experto y la propuesta final al cliente, con los comentarios de las áreas.",
      );
      return;
    }
    const ok = confirmInternalKickoff(projectId, payload, sessionUser.id);
    if (!ok) {
      setError("Falta la validación: propuesta, comentarios de todas las áreas y cierre del gestor.");
      return;
    }
    patchDraft({
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
          "El kickoff interno exige el criterio crítico de todas las áreas. Mientras haya pendientes o un no viable, no se abre el kickoff con el cliente.",
      );
      return;
    }
    setError(null);
    setStep("clientKickoff");
  }

  function submitClientKickoff() {
    if (!projectId) return;
    saveKickoff(projectId, draft);
    const ok = confirmClientKickoff(projectId, draft);
    if (!ok) {
      setError("Registra los acuerdos con el cliente para dar inicio al proyecto y al cronograma.");
      return;
    }
    onStarted(projectId);
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
              Identificación de la obra. Las fechas contractuales y legales se cierran en el kickoff interno.
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
        </div>
      ) : null}

      {step === "internal" ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Kickoff interno</h2>
            <p className="mt-1 text-sm text-slate-600">
              1) Extracto de lo vendido. 2) Cada área deja razones por escrito (documento opcional). 3) Con
              esos comentarios se cierra el kickoff interno y se abre el del cliente.
            </p>
          </div>

          <section className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3">
            <h3 className="font-semibold">1. Propuesta de Comercial</h3>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Extracto que comentan las áreas</span>
              <textarea
                rows={4}
                value={draft.proposal?.body ?? ""}
                onChange={(event) => patchProposal({ body: event.target.value, title: draft.proposal?.title || "Propuesta inicial" })}
                placeholder="Alcance, plazos, supuestos y exclusiones. Con este texto ya se puede comentar."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Documento (opcional)</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onProposalFile(file);
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              {draft.proposal?.fileName ? (
                <span className="mt-1 block text-xs text-slate-600">Adjunto: {draft.proposal.fileName}</span>
              ) : null}
            </label>
            {!commercialDone ? (
              <button
                type="button"
                onClick={deliverCommercial}
                className="rounded-md bg-sky-800 px-3 py-2 text-sm text-white hover:bg-sky-900"
              >
                Registrar propuesta
              </button>
            ) : (
              <p className="text-xs font-medium text-emerald-800">Propuesta registrada · {personName(merged.commercialDeliveredBy)}</p>
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
            <h3 className="font-semibold">3. Cierre del gestor</h3>
            <p className="text-xs text-slate-600">
              El gestor sintetiza las razones escritas de las áreas. Si faltan comentarios o hay un no viable,
              no se puede confirmar ni pasar al cliente.
            </p>
            {gate.verdict === "nogo" || gate.verdict === "incomplete" ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-950">
                {gate.reasons[0]}
              </p>
            ) : null}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">¿Se puede cumplir lo vendido?</legend>
              {COMMERCIAL_FIT_OPTIONS.map((option) => (
                <label key={option.id} className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="pmFit"
                    checked={draft.pmFit === option.id}
                    onChange={() => patchDraft({ pmFit: option.id as CommercialFit })}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">{option.label}</span>
                    <span className="block text-xs text-slate-600">{option.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Fundamento con el criterio de las áreas</span>
              <textarea
                rows={2}
                value={draft.pmJudgment ?? ""}
                onChange={(event) => patchDraft({ pmJudgment: event.target.value })}
                placeholder="Cómo el conocimiento conjunto de las áreas justifica desarrollar la obra."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
              />
            </label>
            {gate.verdict === "conditional" || (draft.pmFit && draft.pmFit !== "within") ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Cómo se incorporan las condiciones de las áreas</span>
                <textarea
                  rows={2}
                  value={draft.pmFulfillmentPlan ?? ""}
                  onChange={(event) => patchDraft({ pmFulfillmentPlan: event.target.value })}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
                />
              </label>
            ) : null}
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Propuesta final al cliente</span>
              <textarea
                rows={3}
                value={draft.finalProposalToClient ?? ""}
                onChange={(event) => patchDraft({ finalProposalToClient: event.target.value })}
                onFocus={() => {
                  if (!draft.finalProposalToClient?.trim()) {
                    patchDraft({ finalProposalToClient: draftFinalProposal(merged) });
                  }
                }}
                placeholder="Se arma con lo vendido y el criterio de las áreas. Edítala antes de cerrar."
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
              />
            </label>
            {!pmDone ? (
              <button
                type="button"
                disabled={!gate.canCloseInternal || !proposalReady(merged.proposal)}
                onClick={confirmPm}
                className="rounded-md bg-amber-800 px-3 py-2 text-sm text-white hover:bg-amber-900 disabled:opacity-40"
              >
                Confirmar como gestor de proyectos
              </button>
            ) : (
              <p className="text-xs font-medium text-emerald-800">Gestor confirmó · {personName(merged.pmValidatedBy)}</p>
            )}
          </section>

          {bothDone ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
              Criterio crítico aprobado. Puedes pasar al kickoff con el cliente.
            </p>
          ) : (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-950">
              {gate.reasons[0] || "La validación interna aún no permite el kickoff con el cliente."}
            </p>
          )}
        </div>
      ) : null}

      {step === "clientKickoff" ? (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Kickoff con el cliente</h2>
            <p className="mt-1 text-sm text-slate-600">
              Cierra el acuerdo con el cliente. Al confirmar, el proyecto queda iniciado y se abre el
              cronograma.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium">Validación interna</p>
            <p className="mt-1">
              Comercial: {merged.commercialDeliveredAt ? personName(merged.commercialDeliveredBy) : "—"}
            </p>
            <p>
              Gestor: {merged.pmValidatedAt ? personName(merged.pmValidatedBy) : "—"} · {fitLabel(merged.pmFit)}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{draft.finalProposalToClient || draft.commercialCommitment}</p>
            {merged.areaReviews?.length ? (
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

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
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
            ? "Iniciar proyecto y abrir cronograma"
            : step === "internal"
              ? "Continuar al kickoff con el cliente"
              : "Continuar"}
        </button>
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
    internalDate: resumedKickoff?.internalDate ?? "",
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
