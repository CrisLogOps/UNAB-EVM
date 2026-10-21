"use client";

import {
  INDIVIDUAL_KICKOFF_QUESTIONS,
  MIN_INDIVIDUAL_EVAL,
  individualEvalComplete,
  individualInternalReady,
  proposalReady,
} from "@/lib/kickoff";
import type { KickoffProposal, ProjectKickoff } from "@/lib/types";

export function IndividualInternalKickoff({
  draft,
  commercialDone,
  internalDone,
  onPatch,
  onProposal,
  onProposalFile,
  onRegisterProposal,
  onConfirmInternal,
}: {
  draft: Partial<ProjectKickoff>;
  commercialDone: boolean;
  internalDone: boolean;
  onPatch: (next: Partial<ProjectKickoff>) => void;
  onProposal: (next: Partial<KickoffProposal>) => void;
  onProposalFile: (file: File) => void;
  onRegisterProposal: () => void;
  onConfirmInternal: () => void;
}) {
  const answers = draft.internalEvalAnswers ?? {};
  const sold = proposalReady(draft.proposal) || Boolean(draft.commercialCommitment?.trim());
  const notesOk = (draft.internalNotes ?? "").trim().length >= MIN_INDIVIDUAL_EVAL;
  const evalOk = individualEvalComplete({
    internalEvalAnswers: answers,
    internalNotes: draft.internalNotes ?? "",
    proposal: draft.proposal,
    commercialCommitment: draft.commercialCommitment ?? "",
  } as ProjectKickoff);
  const canClose = individualInternalReady({
    ...draft,
    internalEvalAnswers: answers,
    internalNotes: draft.internalNotes ?? "",
    proposal: draft.proposal,
    commercialCommitment: draft.commercialCommitment ?? "",
  } as ProjectKickoff);

  function setAnswer(id: string, value: string) {
    onPatch({ internalEvalAnswers: { ...answers, [id]: value } });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Kickoff interno</h2>
        <p className="mt-1 text-sm text-slate-600">
          El documento El proyecto ya está en antecedentes. Acá unificás las notas y el criterio PMBOK, y formalizás
          con tu nombre antes de ir al kickoff con el cliente.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3">
        <h3 className="font-semibold">1. Propuesta comercial · lo vendido</h3>
        <p className="text-xs text-slate-600">
          Descripción del alcance vendido. El archivo es evidencia para el expediente con el cliente.
        </p>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Alcance de lo vendido</span>
          <textarea
            rows={5}
            value={draft.proposal?.body ?? ""}
            disabled={commercialDone}
            onChange={(event) =>
              onProposal({ body: event.target.value, title: draft.proposal?.title || "Propuesta comercial" })
            }
            placeholder="Qué se vendió: alcance, plazos, supuestos, exclusiones y entregables."
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-50"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Documento El proyecto (PDF)</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            disabled={commercialDone}
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
        {!commercialDone ? (
          <button
            type="button"
            onClick={onRegisterProposal}
            disabled={!sold}
            className="rounded-md bg-sky-800 px-3 py-2 text-sm text-white hover:bg-sky-900 disabled:opacity-40"
          >
            Registrar propuesta
          </button>
        ) : (
          <p className="text-xs font-medium text-emerald-800">Propuesta registrada. Queda en el expediente de la obra.</p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 p-3">
        <h3 className="font-semibold">2. Notas internas para el kickoff con el cliente</h3>
        <p className="text-xs text-slate-600">
          Lo que vas a contrastar en el Día 1: puntos abiertos, condiciones y lo que el mandante debe confirmar.
        </p>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Notas a validar con el cliente</span>
          <textarea
            rows={4}
            value={draft.internalNotes ?? ""}
            disabled={internalDone}
            onChange={(event) => onPatch({ internalNotes: event.target.value })}
            placeholder="Ej. confirmar acceso a faena, hito de inicio, forma de evidenciar el avance, plazos de pago."
            className="w-full rounded-md border border-slate-200 px-3 py-2 disabled:bg-slate-50"
          />
        </label>
        {!notesOk ? (
          <p className="text-xs text-slate-500">Mínimo {MIN_INDIVIDUAL_EVAL} caracteres.</p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
        <h3 className="font-semibold">3. Criterio de evaluación (PMBOK)</h3>
        <p className="text-xs text-slate-600">
          Preguntas para elaborar el proyecto sin contraparte interna. Cada respuesta queda como registro documental.
        </p>
        {INDIVIDUAL_KICKOFF_QUESTIONS.map((item) => (
          <label key={item.id} className="block text-sm">
            <span className="mb-1 block font-medium">
              {item.knowledgeArea}. {item.question}
            </span>
            <span className="mb-1 block text-xs text-slate-500">{item.hint}</span>
            <textarea
              rows={2}
              value={answers[item.id] ?? ""}
              disabled={internalDone}
              onChange={(event) => setAnswer(item.id, event.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-50"
            />
          </label>
        ))}
        {!evalOk ? (
          <p className="text-xs text-slate-500">
            Completá las {INDIVIDUAL_KICKOFF_QUESTIONS.length} preguntas (mínimo {MIN_INDIVIDUAL_EVAL} caracteres cada
            una).
          </p>
        ) : (
          <p className="text-xs font-medium text-emerald-800">Criterio PMBOK completo.</p>
        )}
      </section>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Nombre de quien formaliza</span>
        <input
          value={draft.internalSignerName ?? ""}
          disabled={internalDone}
          onChange={(event) => onPatch({ internalSignerName: event.target.value })}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-50"
        />
      </label>

      {!internalDone ? (
        <button
          type="button"
          disabled={!canClose || (draft.internalSignerName ?? "").trim().length < 3}
          onClick={onConfirmInternal}
          className="rounded-md bg-amber-800 px-3 py-2 text-sm text-white hover:bg-amber-900 disabled:opacity-40"
        >
          Formalizar kickoff interno
        </button>
      ) : (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Kickoff interno cerrado. Podés pasar a los acuerdos con el cliente. El criterio y las notas quedan en el
          expediente.
        </p>
      )}
    </div>
  );
}
