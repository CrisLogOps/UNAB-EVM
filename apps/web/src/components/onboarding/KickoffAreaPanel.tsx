"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import {
  COMMERCIAL_FIT_OPTIONS,
  MIN_AREA_JUSTIFICATION,
  REVIEW_STANCE_OPTIONS,
  VERDICT_LABEL,
  areaReviewFor,
  areaReviewsComplete,
  areasUserCanReview,
  draftFinalProposal,
  emptyProposal,
  evaluateInternalGate,
  involvedAreas,
  pendingAreas,
  proposalReady,
  relatedKnowledge,
} from "@/lib/kickoff";
import type {
  CommercialFit,
  KickoffReviewStance,
  KnowledgeEntry,
  OrgArea,
  ProjectKickoff,
  TenantUser,
} from "@/lib/types";

export function KickoffAreaPanel({
  projectId,
  kickoff,
  showExtract = false,
}: {
  projectId: string;
  kickoff: ProjectKickoff;
  showExtract?: boolean;
}) {
  const {
    areas,
    users,
    sessionUser,
    ownerManagesAll,
    recordAreaKickoffReview,
    saveKickoff,
    stampCommercialKickoff,
    confirmInternalKickoff,
    project,
    knowledge,
    tenant,
  } = useOrg();
  const involved = involvedAreas(areas);
  const pending = pendingAreas(kickoff, areas);
  const writable = areasUserCanReview(sessionUser, areas, ownerManagesAll);
  const ready = proposalReady(kickoff.proposal);
  const areasDone = areaReviewsComplete(kickoff, areas);
  const gate = evaluateInternalGate(kickoff, areas);
  const locked = Boolean(kickoff.clientConfirmedAt) || (Boolean(kickoff.pmValidatedAt) && gate.canMeetClient);
  const canClosePm = sessionUser.role === "owner" || sessionUser.role === "pmo" || ownerManagesAll;
  const [extract, setExtract] = useState(kickoff.proposal.body ?? "");
  const [extractError, setExtractError] = useState<string | null>(null);

  function persistExtract() {
    const body = extract.trim();
    if (!body) {
      setExtractError("Escribe el extracto para que las áreas evalúen la misma propuesta.");
      return false;
    }
    const proposal = {
      ...emptyProposal(),
      ...kickoff.proposal,
      body,
      title: kickoff.proposal.title || "Propuesta inicial",
    };
    saveKickoff(projectId, {
      proposal,
      commercialCommitment: kickoff.commercialCommitment.trim() || body,
    });
    stampCommercialKickoff(
      projectId,
      {
        proposal,
        commercialCommitment: kickoff.commercialCommitment.trim() || body,
        soldStartDate: kickoff.soldStartDate,
        soldFinishDate: kickoff.soldFinishDate,
      },
      sessionUser.id,
    );
    setExtractError(null);
    return true;
  }

  return (
    <section className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/70 p-3">
      <div>
        <h3 className="font-semibold">Kickoff interno · criterio crítico de las áreas</h3>
        <p className="text-xs text-slate-600">
          Todas las áreas involucradas dejan por escrito las razones que justifican el proyecto. Un documento
          de respaldo es opcional. Con esos comentarios el gestor toma el kickoff interno y recién ahí se
          abre el kickoff con el cliente.
        </p>
      </div>

      <CriticalGateBoard kickoff={kickoff} gate={gate} involved={involved} />

      {showExtract ? (
        <div className="space-y-2 rounded-lg border border-violet-100 bg-white p-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Extracto de lo vendido</span>
            <textarea
              rows={4}
              value={extract}
              disabled={locked}
              onChange={(event) => {
                setExtract(event.target.value);
                setExtractError(null);
              }}
              placeholder="Alcance, plazos, supuestos y exclusiones. Con este texto las áreas evalúan la misma propuesta."
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </label>
          {extractError ? <p className="text-xs text-red-700">{extractError}</p> : null}
          {locked ? null : (
            <button
              type="button"
              onClick={persistExtract}
              className="rounded-md bg-sky-800 px-3 py-1.5 text-xs text-white hover:bg-sky-900"
            >
              {ready ? "Actualizar extracto" : "Guardar extracto y habilitar validación"}
            </button>
          )}
        </div>
      ) : ready ? (
        <div className="rounded-lg border border-violet-100 bg-white p-3 text-sm">
          <p className="font-medium">{kickoff.proposal.title || kickoff.proposal.fileName || "Propuesta inicial"}</p>
          <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-slate-700">{kickoff.proposal.body}</p>
        </div>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Escribe el extracto de la propuesta en el recuadro de Comercial (arriba). Con ese texto las áreas
          pueden justificar el desarrollo.
        </p>
      )}

      <ul className="space-y-2">
        {involved.map((area) => (
          <AreaCommentRow
            key={area.id}
            area={area}
            kickoff={kickoff}
            ready={ready}
            canWrite={Boolean(writable.some((item) => item.id === area.id) && ready && !locked)}
            locked={locked}
            reviewer={areaReviewFor(kickoff, area.id)?.userId}
            users={users}
            lessons={relatedKnowledge(knowledge, area.id, projectId, tenant.activityType)}
            onSave={(input) =>
              recordAreaKickoffReview(projectId, {
                ...input,
                areaId: area.id,
                snapshot: kickoff,
              })
            }
          />
        ))}
      </ul>

      {showExtract && areasDone && !locked && canClosePm ? (
        <PmCloseForm
          projectId={projectId}
          kickoff={kickoff}
          projectStart={project.startDate}
          projectFinish={project.finishDate}
          onConfirm={confirmInternalKickoff}
          userId={sessionUser.id}
          requirePlan={gate.verdict === "conditional"}
          canClose={gate.canCloseInternal}
          blockReason={gate.reasons[0]}
        />
      ) : null}

      {showExtract && kickoff.pmValidatedAt ? (
        gate.canMeetClient ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
            Criterio crítico aprobado.{" "}
            <Link href="/clients" className="font-medium underline">
              Continuar al kickoff con el cliente
            </Link>
          </p>
        ) : (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-950">
            El kickoff con el cliente sigue bloqueado. {gate.reasons[0] ?? "Completa la validación interna."}
          </p>
        )
      ) : null}

      {pending.length && !showExtract ? (
        <p className="text-xs text-slate-600">Pendientes: {pending.map((item) => item.name).join(", ")}.</p>
      ) : null}
    </section>
  );
}

function CriticalGateBoard({
  kickoff,
  gate,
  involved,
}: {
  kickoff: ProjectKickoff;
  gate: ReturnType<typeof evaluateInternalGate>;
  involved: OrgArea[];
}) {
  const tone =
    gate.verdict === "go"
      ? "border-emerald-300 bg-emerald-50 text-emerald-950"
      : gate.verdict === "conditional"
        ? "border-amber-300 bg-amber-50 text-amber-950"
        : "border-red-300 bg-red-50 text-red-950";

  return (
    <div className={`space-y-2 rounded-lg border p-3 ${tone}`}>
      <p className="text-sm font-semibold">{VERDICT_LABEL[gate.verdict]}</p>
      <ul className="space-y-1 text-xs">
        {involved.map((area) => {
          const review = areaReviewFor(kickoff, area.id);
          const stance = REVIEW_STANCE_OPTIONS.find((item) => item.id === review?.stance)?.label;
          return (
            <li key={area.id}>
              <span className="font-medium">{area.name}:</span>{" "}
              {review
                ? `${stance ?? review.stance}${review.evidenceFileName ? ` · ${review.evidenceFileName}` : ""}`
                : "sin validar"}
            </li>
          );
        })}
      </ul>
      {gate.reasons.map((reason) => (
        <p key={reason} className="text-xs">
          {reason}
        </p>
      ))}
      {gate.verdict !== "go" && gate.verdict !== "conditional" ? (
        <p className="text-xs font-medium">No se habilita el kickoff final con el cliente.</p>
      ) : null}
    </div>
  );
}

function AreaCommentRow({
  area,
  kickoff,
  ready,
  canWrite,
  locked,
  reviewer,
  users,
  lessons,
  onSave,
}: {
  area: OrgArea;
  kickoff: ProjectKickoff;
  ready: boolean;
  canWrite: boolean;
  locked: boolean;
  reviewer?: string;
  users: TenantUser[];
  lessons: KnowledgeEntry[];
  onSave: (input: {
    stance: KickoffReviewStance;
    comment: string;
    evidenceFileName?: string;
    evidenceFileType?: string;
    evidenceFileSize?: number;
    knowledgeRefs?: string[];
  }) => boolean;
}) {
  const existing = areaReviewFor(kickoff, area.id);
  const [stance, setStance] = useState<KickoffReviewStance>(existing?.stance ?? "ok");
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [evidence, setEvidence] = useState({
    fileName: existing?.evidenceFileName ?? "",
    fileType: existing?.evidenceFileType ?? "",
    fileSize: existing?.evidenceFileSize ?? 0,
  });
  const [error, setError] = useState<string | null>(null);
  const person = reviewer ? users.find((item) => item.id === reviewer) : undefined;

  function submit() {
    const ok = onSave({
      stance,
      comment,
      evidenceFileName: evidence.fileName,
      evidenceFileType: evidence.fileType,
      evidenceFileSize: evidence.fileSize,
      knowledgeRefs: lessons.map((item) => item.id),
    });
    setError(
      ok
        ? null
        : `Escribe las razones de ${area.name} (mínimo ${MIN_AREA_JUSTIFICATION} caracteres). El documento es opcional.`,
    );
  }

  return (
    <li className="rounded-lg bg-white px-3 py-2">
      <p className="text-sm font-medium">
        {area.name}
        <span className="ml-2 text-xs font-normal text-slate-500">
          {existing ? "Razones registradas" : locked ? "Sin validar" : "Pendiente"}
        </span>
      </p>
      {existing && !canWrite ? (
        <div className="mt-1 space-y-1 text-sm text-slate-600">
          <p>
            {REVIEW_STANCE_OPTIONS.find((item) => item.id === existing.stance)?.label}: {existing.comment}
          </p>
          {existing.evidenceFileName ? (
            <p className="text-xs text-slate-500">Documento (opcional): {existing.evidenceFileName}</p>
          ) : null}
          {person ? (
            <p className="text-xs text-slate-500">
              {person.name || person.email} · {ROLE_LABELS[person.role]}
            </p>
          ) : null}
        </div>
      ) : null}
      {lessons.length ? (
        <div className="mt-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Conocimiento previo de {area.name}
          </p>
          <ul className="mt-1 space-y-1">
            {lessons.map((item) => (
              <li key={item.id} className="text-xs text-slate-600">
                <span className="font-medium">
                  {REVIEW_STANCE_OPTIONS.find((entry) => entry.id === item.stance)?.label}:
                </span>{" "}
                {item.comment.slice(0, 140)}
                {item.comment.length > 140 ? "…" : ""}
                {item.projectName ? ` · ${item.projectName}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-1 text-[11px] text-slate-500">
          Aún no hay lecciones de esta área en otras obras. Esta validación alimenta Conocimiento.
        </p>
      )}
      {canWrite ? (
        <div className="mt-2 space-y-2">
          <div className="flex flex-col gap-2 text-xs">
            {REVIEW_STANCE_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-start gap-2 rounded-md border border-slate-100 px-2 py-1.5">
                <input type="radio" checked={stance === option.id} onChange={() => setStance(option.id)} className="mt-0.5" />
                <span>
                  <span className="font-medium">{option.label}</span>
                  <span className="block text-slate-500">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <textarea
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={`¿Por qué ${area.name} justifica (o no) desarrollar esta obra? Incluye riesgos, capacidad y supuestos.`}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-slate-500">
            {comment.trim().length}/{MIN_AREA_JUSTIFICATION} caracteres mínimos.
          </p>
          <details className="rounded-md border border-slate-100 px-2 py-1.5">
            <summary className="cursor-pointer text-sm font-medium">Documento de respaldo (opcional)</summary>
            <label className="mt-2 block text-sm">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,image/*,application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setEvidence({ fileName: file.name, fileType: file.type, fileSize: file.size });
                }}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              {evidence.fileName ? (
                <span className="mt-1 block text-xs text-slate-600">Adjunto: {evidence.fileName}</span>
              ) : (
                <span className="mt-1 block text-xs text-slate-500">
                  Solo si hay un archivo que respalde las razones. El flujo avanza con el texto de las áreas.
                </span>
              )}
            </label>
          </details>
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-violet-800 px-3 py-1.5 text-xs text-white hover:bg-violet-900"
          >
            {existing ? "Actualizar validación" : "Registrar validación del área"}
          </button>
        </div>
      ) : !existing && !locked && !ready ? (
        <p className="mt-1 text-xs text-slate-500">Guarda el extracto para habilitar la validación de esta área.</p>
      ) : null}
    </li>
  );
}

function PmCloseForm({
  projectId,
  kickoff,
  projectStart,
  projectFinish,
  onConfirm,
  userId,
  requirePlan,
  canClose,
  blockReason,
}: {
  projectId: string;
  kickoff: ProjectKickoff;
  projectStart: string;
  projectFinish: string;
  onConfirm: (projectId: string, patch?: Partial<ProjectKickoff>, userId?: string) => boolean;
  userId: string;
  requirePlan: boolean;
  canClose: boolean;
  blockReason?: string;
}) {
  const [fit, setFit] = useState<CommercialFit>(kickoff.pmFit || (requirePlan ? "adjust" : "within"));
  const [judgment, setJudgment] = useState(kickoff.pmJudgment || "");
  const [plan, setPlan] = useState(kickoff.pmFulfillmentPlan || "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!canClose) {
      setError(blockReason || "El criterio crítico de las áreas aún no permite cerrar.");
      return;
    }
    if (!acknowledged) {
      setError("Confirma que revisaste el criterio crítico de todas las áreas.");
      return;
    }
    if (!judgment.trim()) {
      setError("Escribe el fundamento del gestor con el conocimiento de las áreas.");
      return;
    }
    if ((requirePlan || fit !== "within") && !plan.trim()) {
      setError("Si hay condiciones de las áreas, el gestor debe registrar cómo se harán cumplir.");
      return;
    }
    const payload: Partial<ProjectKickoff> = {
      ...kickoff,
      pmFit: fit,
      pmJudgment: judgment.trim(),
      pmFulfillmentPlan: fit === "within" && !requirePlan ? "" : plan.trim(),
      plannedStartDate: kickoff.plannedStartDate || projectStart,
      plannedFinishDate: kickoff.plannedFinishDate || projectFinish,
      finalProposalToClient:
        kickoff.finalProposalToClient.trim() ||
        draftFinalProposal({
          ...kickoff,
          pmFit: fit,
          pmJudgment: judgment.trim(),
        }),
      pmValidatedBy: userId,
    };
    const ok = onConfirm(projectId, payload, userId);
    setError(ok ? null : "El criterio crítico todavía bloquea el cierre interno.");
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
      <h4 className="font-semibold">Cierre del gestor</h4>
      <p className="text-xs text-slate-600">
        El gestor no sustituye a las áreas: sintetiza su conocimiento y solo cierra si el criterio crítico lo
        permite.
      </p>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">¿Se puede cumplir lo vendido?</legend>
        {COMMERCIAL_FIT_OPTIONS.map((option) => (
          <label key={option.id} className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm">
            <input
              type="radio"
              name={`pmFit-${projectId}`}
              checked={fit === option.id}
              onChange={() => setFit(option.id)}
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
          value={judgment}
          onChange={(event) => setJudgment(event.target.value)}
          placeholder="Cómo el conocimiento conjunto de las áreas justifica (o condiciona) desarrollar la obra."
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
        />
      </label>
      {requirePlan || fit !== "within" ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Cómo se incorporan las condiciones de las áreas</span>
          <textarea
            rows={2}
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
          />
        </label>
      ) : null}
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
          className="mt-1"
        />
        <span>Revisé las razones escritas de todas las áreas involucradas.</span>
      </label>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        disabled={!canClose}
        className="rounded-md bg-amber-800 px-3 py-2 text-sm text-white hover:bg-amber-900 disabled:opacity-40"
      >
        Confirmar como gestor de proyectos
      </button>
    </div>
  );
}
