"use client";

import {
  WORK_BOOK_BOARD_COLUMNS,
  folioLabel,
  isWorkBookBlocker,
  workBookBoardCounts,
  workBookKindMeta,
} from "@/lib/work-book";
import type { GanttActivity, WorkBookBoardStatus, WorkBookEntry } from "@/lib/types";

function formatDay(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

function nextMoves(status: WorkBookBoardStatus): { id: WorkBookBoardStatus; label: string }[] {
  if (status === "open") return [{ id: "doing", label: "A faena" }, { id: "closed", label: "Cerrar" }];
  if (status === "doing") return [{ id: "open", label: "Devolver" }, { id: "closed", label: "Cerrar" }];
  return [{ id: "doing", label: "Reabrir" }];
}

export function WorkBookBoard({
  entries,
  gantt,
  canWrite,
  independent,
  onMove,
}: {
  entries: WorkBookEntry[];
  gantt: GanttActivity[];
  canWrite: boolean;
  independent: boolean;
  onMove: (id: string, status: WorkBookBoardStatus) => void;
}) {
  const counts = workBookBoardCounts(entries);
  const blockers = entries.filter(isWorkBookBlocker).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {independent
          ? "No hay ITO ni gestor que valide por vos. Este tablero es tu autocontrol de faena: arrastrás el trabajo con un toque. Al cerrar un parte de avance ligado, el EV de esa partida cuenta."
          : "Tablero operativo del Libro. La firma legal y la validación de evidencias siguen en sus pantallas."}
      </p>
      {blockers ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {blockers} impedimento{blockers === 1 ? "" : "s"} abierto
          {blockers === 1 ? "" : "s"} (ITO, observación o interferencia). Cerrarlos acá no sustituye el PDF firmado.
        </p>
      ) : null}

      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="grid min-w-[48rem] grid-cols-3 gap-3 sm:min-w-0">
          {WORK_BOOK_BOARD_COLUMNS.map((column) => {
            const cards = entries
              .filter((item) => item.boardStatus === column.id)
              .sort((a, b) => b.folio - a.folio);
            return (
              <section key={column.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 sm:p-3">
                <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">{column.label}</h2>
                    <p className="text-[11px] text-slate-500">{column.hint}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-slate-700">{counts[column.id]}</p>
                </div>
                <ul className="space-y-2">
                  {cards.length ? (
                    cards.map((item) => {
                      const meta = workBookKindMeta(item.kind);
                      const activity = gantt.find((row) => row.id === item.activityId);
                      const blocker = isWorkBookBlocker(item);
                      return (
                        <li
                          key={item.id}
                          className={`rounded-lg border bg-white p-3 ${
                            blocker ? "border-amber-300" : "border-slate-200"
                          }`}
                        >
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">
                            {folioLabel(item.folio)} · {meta.short} · {formatDay(item.occurredOn)}
                            {blocker ? " · impedimento" : ""}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">{meta.label}</p>
                          {activity ? (
                            <p className="text-xs text-slate-600">
                              {activity.code ? `${activity.code} · ` : ""}
                              {activity.name}
                            </p>
                          ) : null}
                          <p className="mt-1 line-clamp-3 text-sm text-slate-700">{item.body}</p>
                          {canWrite ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {nextMoves(item.boardStatus).map((move) => (
                                <button
                                  key={move.id}
                                  type="button"
                                  onClick={() => onMove(item.id, move.id)}
                                  className={`min-h-9 rounded-md px-2.5 text-xs ${
                                    move.id === "closed"
                                      ? "bg-[var(--brand)] text-white"
                                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {move.label}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </li>
                      );
                    })
                  ) : (
                    <li className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-500">
                      Vacío
                    </li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
