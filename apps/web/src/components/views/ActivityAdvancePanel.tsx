"use client";

import { useMemo, useState } from "react";
import {
  CLOSURE_LABEL,
  NATURE_HINT,
  NATURE_LABEL,
  composedPercent,
  defaultNature,
  piecesOf,
  rebalance,
} from "@/lib/activity-progress";
import type { ActivityNature, ActivityPiece, GanttActivity, ProgressClosure } from "@/lib/types";

export function ActivityAdvancePanel({
  activity,
  requireFile,
  onClose,
  onSubmit,
}: {
  activity: GanttActivity;
  requireFile: boolean;
  onClose: () => void;
  onSubmit: (input: {
    percent: number;
    note: string;
    fileName: string;
    closure: ProgressClosure;
    pieceIds: string[];
    scopeNote: string;
    doneWhen: string;
    nature: ActivityNature;
    pieces: ActivityPiece[];
    ac: number;
  }) => string | null;
}) {
  const [nature, setNature] = useState<ActivityNature>(defaultNature(activity));
  const [scopeNote, setScopeNote] = useState(activity.scopeNote || "");
  const [doneWhen, setDoneWhen] = useState(activity.doneWhen || "");
  const [pieces, setPieces] = useState<ActivityPiece[]>(() => piecesOf(activity));
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [closure, setClosure] = useState<ProgressClosure>("parcial");
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState("");
  const [ac, setAc] = useState("0");
  const [error, setError] = useState<string | null>(null);

  const marks = useMemo(
    () =>
      pieces
        .filter((piece) => ratios[piece.id] > 0)
        .map((piece) => ({ id: piece.id, ratio: nature === "registro" ? ratios[piece.id] : 1 })),
    [pieces, ratios, nature],
  );
  const percent = composedPercent(pieces, marks);

  function toggle(id: string) {
    setRatios((current) => ({ ...current, [id]: current[id] > 0 ? 0 : 1 }));
  }

  function addPiece() {
    const next = rebalance([
      ...pieces,
      { id: `pz-${Date.now()}`, title: nature === "version" ? `Versión ${pieces.length + 1}` : "Nuevo tramo", detail: "", weight: 0 },
    ]);
    setPieces(next);
  }

  function removeLastPiece() {
    if (pieces.length < 2) return;
    const removed = pieces[pieces.length - 1];
    setPieces(rebalance(pieces.slice(0, -1)));
    setRatios((current) => {
      const next = { ...current };
      delete next[removed.id];
      return next;
    });
  }

  function save() {
    const counts = closure === "parcial" || closure === "conforme";
    if ((closure === "prerequisito" || closure === "no_conforme") && note.trim().length < 8) {
      setError("La nota explica el requisito o la no conformidad.");
      return;
    }
    if (counts && percent <= 0) {
      setError("Marca al menos un tramo para componer el avance.");
      return;
    }
    if (closure === "conforme" && percent < 100) {
      setError("Conforme pide el 100% de los tramos. Si falta algo, usa cierre parcial o requisito.");
      return;
    }
    if (counts && (requireFile || nature === "archivo") && !fileName) {
      setError(nature === "archivo" ? "Adjunta el archivo de este tramo." : "En terreno hace falta el archivo.");
      return;
    }
    const message = onSubmit({
      percent: counts ? percent : activity.progress,
      note: note.trim(),
      fileName,
      closure,
      pieceIds: marks.map((item) => item.id),
      scopeNote: scopeNote.trim(),
      doneWhen: doneWhen.trim(),
      nature,
      pieces,
      ac: Number(ac) || 0,
    });
    if (message) setError(message);
  }

  return (
    <section className="space-y-3 rounded-xl border border-sky-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            Avance parcial · {activity.code ? `${activity.code} · ` : ""}
            {activity.name}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Hoy va en {activity.progress}%. Este registro compone el siguiente % según la naturaleza de la actividad.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-sm underline">
          Cerrar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">En qué consiste</span>
          <textarea
            rows={2}
            value={scopeNote}
            onChange={(event) => setScopeNote(event.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Qué necesita para terminarse</span>
          <textarea
            rows={2}
            value={doneWhen}
            onChange={(event) => setDoneWhen(event.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Naturaleza del avance</span>
        <select
          value={nature}
          onChange={(event) => setNature(event.target.value as ActivityNature)}
          className="w-full rounded-md border border-slate-200 px-3 py-2 sm:max-w-sm"
        >
          {(Object.keys(NATURE_LABEL) as ActivityNature[]).map((item) => (
            <option key={item} value={item}>
              {NATURE_LABEL[item]}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-slate-500">{NATURE_HINT[nature]}</span>
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Tramos que componen el %</p>
          <span className="flex gap-3">
            <button type="button" onClick={addPiece} className="text-sm underline">
              Agregar tramo
            </button>
            <button
              type="button"
              onClick={removeLastPiece}
              disabled={pieces.length < 2}
              className="text-sm underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
            >
              Quitar último tramo
            </button>
          </span>
        </div>
        {pieces.map((piece) => (
          <div key={piece.id} className="grid gap-2 rounded-md border border-slate-200 p-2 sm:grid-cols-[auto_1fr_5rem]">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(ratios[piece.id] ?? 0) > 0}
                onChange={() => toggle(piece.id)}
              />
              Entra
            </label>
            <div>
              <input
                value={piece.title}
                onChange={(event) =>
                  setPieces((current) =>
                    current.map((item) => (item.id === piece.id ? { ...item, title: event.target.value } : item)),
                  )
                }
                className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
              />
              <input
                value={piece.detail}
                onChange={(event) =>
                  setPieces((current) =>
                    current.map((item) => (item.id === piece.id ? { ...item, detail: event.target.value } : item)),
                  )
                }
                placeholder="Qué aporta este tramo al término"
                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs"
              />
            </div>
            {nature === "registro" ? (
              <label className="text-xs">
                % del tramo
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round((ratios[piece.id] ?? 0) * 100)}
                  onChange={(event) =>
                    setRatios((current) => ({
                      ...current,
                      [piece.id]: Math.min(100, Math.max(0, Number(event.target.value) || 0)) / 100,
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1"
                />
              </label>
            ) : (
              <p className="self-center text-xs text-slate-500">{piece.weight} pts</p>
            )}
          </div>
        ))}
        <p className="text-sm font-medium">Avance compuesto: {percent}%</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Cierre de este registro</span>
          <select
            value={closure}
            onChange={(event) => setClosure(event.target.value as ProgressClosure)}
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          >
            {(Object.keys(CLOSURE_LABEL) as ProgressClosure[]).map((item) => (
              <option key={item} value={item}>
                {CLOSURE_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Gasto del día (CLP)</span>
          <input
            type="number"
            min={0}
            value={ac}
            onChange={(event) => setAc(event.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Nota</span>
        <textarea
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Qué se hizo, qué versión queda, o por qué no está conforme."
          className="w-full rounded-md border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Archivo</span>
        <input
          type="file"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          className="w-full text-sm"
        />
        {fileName ? <span className="mt-1 block text-xs text-slate-500">{fileName}</span> : null}
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        onClick={save}
        className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
      >
        Guardar avance
      </button>
    </section>
  );
}
