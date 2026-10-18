"use client";

import { useState } from "react";
import Link from "next/link";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import {
  MIN_AREA_JUSTIFICATION,
  VERDICT_LABEL,
  areaReviewFor,
  actsAsSoleOperator,
  areasNeedingCounterpart,
  areasUserCanReview,
  canEditSoldExtract,
  counterpartForArea,
  emptyProposal,
  evaluateInternalGate,
  involvedAreas,
  pendingAreas,
  proposalReady,
  relatedKnowledge,
} from "@/lib/kickoff";
import type {
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
    knowledge,
    tenant,
  } = useOrg();
  const involved = involvedAreas(areas);
  const pending = pendingAreas(kickoff, areas);
  const sole = actsAsSoleOperator(users, ownerManagesAll);
  const writable = areasUserCanReview(sessionUser, areas, users, ownerManagesAll);
  const ready = proposalReady(kickoff.proposal);
  const gate = evaluateInternalGate(kickoff, areas);
  const locked = Boolean(kickoff.clientConfirmedAt);
  const canStampCommercial = canEditSoldExtract(sessionUser, users, ownerManagesAll);
  const missingCounterparts = sole ? [] : areasNeedingCounterpart(areas, users, sessionUser.areaId);
  const [extract, setExtract] = useState(kickoff.proposal.body ?? "");
  const [extractError, setExtractError] = useState<string | null>(null);

  function persistExtract() {
    if (!canStampCommercial) {
      setExtractError("El extracto lo registran el administrador o el gestor de proyectos.");
      return false;
    }
    const body = extract.trim();
    if (!body) {
      setExtractError("Escribe el extracto para que las áreas puedan comentar la misma propuesta.");
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
        <h3 className="font-semibold">Kickoff interno · comentarios de las áreas</h3>
        <p className="text-xs text-slate-600">
          {sole
            ? "Eres el único integrante: puedes dejar comentarios de todas las áreas."
            : "Cada área deja comentarios sobre lo vendido. No hay validación de viabilidad: los comentarios quedan como registro y no impiden continuar."}{" "}
          Un documento de respaldo es opcional.
        </p>
      </div>

      <CriticalGateBoard kickoff={kickoff} gate={gate} involved={involved} />

      {missingCounterparts.length ? (
        <p className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-sky-950">
          Áreas de la organización sin contraparte: {missingCounterparts.map((item) => item.name).join(", ")}.{" "}
          <Link href="/users" className="font-medium underline">
            Asignar personas
          </Link>{" "}
          para que cada una deje comentarios.
        </p>
      ) : null}

      {showExtract ? (
        <div className="space-y-2 rounded-lg border border-violet-100 bg-white p-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Extracto de lo vendido</span>
            <textarea
              rows={4}
              value={extract}
              disabled={locked || !canStampCommercial}
              onChange={(event) => {
                setExtract(event.target.value);
                setExtractError(null);
              }}
              placeholder="Alcance, plazos, supuestos y exclusiones. Con este texto las áreas comentan la misma propuesta."
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </label>
          {extractError ? <p className="text-xs text-red-700">{extractError}</p> : null}
          {canStampCommercial ? null : (
            <p className="text-xs text-slate-600">
              El extracto lo registran el administrador o el gestor. Cambia de puesto en{" "}
              <span className="font-medium">Ver como</span> si estás en otro perfil.
            </p>
          )}
          {locked || !canStampCommercial ? null : (
            <button
              type="button"
              onClick={persistExtract}
              className="rounded-md bg-sky-800 px-3 py-1.5 text-xs text-white hover:bg-sky-900"
            >
              {ready ? "Actualizar extracto" : "Guardar extracto y habilitar comentarios"}
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
          Escribe el extracto de lo vendido arriba. Con ese texto las áreas pueden comentar. No hace falta un
          área comercial.
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
            waitingOn={counterpartForArea(area, users)}
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

      {showExtract && gate.canMeetClient ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Extracto y plazo listos.{" "}
          <Link href="/clients" className="font-medium underline">
            Continuar al kickoff con el cliente
          </Link>
        </p>
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
  const tone = gate.verdict === "go" ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-amber-300 bg-amber-50 text-amber-950";

  return (
    <div className={`space-y-2 rounded-lg border p-3 ${tone}`}>
      <p className="text-sm font-semibold">{VERDICT_LABEL[gate.verdict]}</p>
      <ul className="space-y-1 text-xs">
        {involved.map((area) => {
          const review = areaReviewFor(kickoff, area.id);
          return (
            <li key={area.id}>
              <span className="font-medium">{area.name}:</span>{" "}
              {review
                ? `comentario registrado${review.evidenceFileName ? ` · ${review.evidenceFileName}` : ""}`
                : "sin comentario (no bloquea)"}
            </li>
          );
        })}
      </ul>
      {kickoff.internalDate || kickoff.clientKickoffDueDate ? (
        <p className="text-xs">
          Consulta: {kickoff.internalDate || "—"} · Plazo kickoff cliente: {kickoff.clientKickoffDueDate || "—"}
        </p>
      ) : null}
      {gate.reasons.map((reason) => (
        <p key={reason} className="text-xs">
          {reason}
        </p>
      ))}
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
  waitingOn,
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
  waitingOn?: TenantUser;
  users: TenantUser[];
  lessons: KnowledgeEntry[];
  onSave: (input: {
    comment: string;
    evidenceFileName?: string;
    evidenceFileType?: string;
    evidenceFileSize?: number;
    knowledgeRefs?: string[];
  }) => boolean;
}) {
  const existing = areaReviewFor(kickoff, area.id);
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
      comment,
      evidenceFileName: evidence.fileName,
      evidenceFileType: evidence.fileType,
      evidenceFileSize: evidence.fileSize,
      knowledgeRefs: lessons.map((item) => item.id),
    });
    setError(
      ok
        ? null
        : `Escribe el comentario de ${area.name} (mínimo ${MIN_AREA_JUSTIFICATION} caracteres). El documento es opcional.`,
    );
  }

  return (
    <li className="rounded-lg bg-white px-3 py-2">
      <p className="text-sm font-medium">
        {area.name}
        <span className="ml-2 text-xs font-normal text-slate-500">
          {existing ? "Comentario registrado" : locked ? "Sin comentario" : "Pendiente"}
        </span>
      </p>
      {existing && !canWrite ? (
        <div className="mt-1 space-y-1 text-sm text-slate-600">
          <p>{existing.comment}</p>
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
                {item.comment.slice(0, 140)}
                {item.comment.length > 140 ? "…" : ""}
                {item.projectName ? ` · ${item.projectName}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-1 text-[11px] text-slate-500">
          Aún no hay lecciones de esta área en otras obras. Este comentario alimenta Conocimiento.
        </p>
      )}
      {canWrite ? (
        <div className="mt-2 space-y-2">
          <textarea
            rows={3}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={`Comentario de ${area.name} sobre lo vendido: riesgos, capacidad, supuestos o ajustes sugeridos.`}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-slate-500">
            {comment.trim().length}/{MIN_AREA_JUSTIFICATION} caracteres para registrar el comentario. No bloquea el avance.
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
                  Solo si hay un archivo que respalde el comentario.
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
            {existing ? "Actualizar comentario" : "Registrar comentario"}
          </button>
        </div>
      ) : !existing && !locked && !ready ? (
        <p className="mt-1 text-xs text-slate-500">Guarda el extracto para habilitar el comentario de esta área.</p>
      ) : !existing && !canWrite && !locked ? (
        <p className="mt-1 text-xs text-slate-600">
          {waitingOn ? (
            <>
              Pendiente de {area.name}: {waitingOn.name || waitingOn.email} · {ROLE_LABELS[waitingOn.role]}. No
              bloquea el avance.
            </>
          ) : (
            <>
              {area.name} está en la organización y no tiene contraparte.{" "}
              <Link href="/users" className="font-medium underline">
                Solicitar contraparte
              </Link>
              . Tampoco bloquea el avance.
            </>
          )}
        </p>
      ) : null}
    </li>
  );
}
