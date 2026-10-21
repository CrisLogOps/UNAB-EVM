import type { ActivityNature, ActivityPiece, GanttActivity, ProgressClosure } from "./types";

export const NATURE_LABEL: Record<ActivityNature, string> = {
  archivo: "Archivos",
  registro: "Registros de medición",
  version: "Versiones",
};

export const NATURE_HINT: Record<ActivityNature, string> = {
  archivo: "El % se compone con los documentos que la actividad necesita.",
  registro: "El % se compone con mediciones parciales de cada registro.",
  version: "Cada versión suma su peso, como un incremento. La contraparte confirma el cierre.",
};

export const CLOSURE_LABEL: Record<ProgressClosure, string> = {
  parcial: "Cierre parcial",
  conforme: "Conforme",
  prerequisito: "Falta un requisito",
  no_conforme: "No conforme",
};

export function defaultNature(item: Pick<GanttActivity, "elementKind" | "requiresFieldEvidence" | "nature">): ActivityNature {
  if (item.nature === "archivo" || item.nature === "registro" || item.nature === "version") return item.nature;
  if (item.elementKind === "inspeccion" || item.requiresFieldEvidence) return "registro";
  return "archivo";
}

export function piecesOf(item: GanttActivity): ActivityPiece[] {
  if (item.pieces?.length) return item.pieces;
  const nature = defaultNature(item);
  const title = nature === "version" ? "Versión 1" : nature === "registro" ? "Medición" : "Documento de término";
  return [{ id: `pz-${item.id}`, title, detail: item.doneWhen || "", weight: 100 }];
}

export function rebalance(pieces: ActivityPiece[]): ActivityPiece[] {
  if (!pieces.length) return pieces;
  const each = Math.floor(100 / pieces.length);
  const rest = 100 - each * pieces.length;
  return pieces.map((piece, index) => ({ ...piece, weight: each + (index === 0 ? rest : 0) }));
}

/** Porcentaje 0–100 según el peso de los tramos marcados. En registro, ratio es el avance de ese tramo. */
export function composedPercent(pieces: ActivityPiece[], marks: { id: string; ratio: number }[]) {
  const total = pieces.reduce((sum, piece) => sum + (piece.weight || 0), 0);
  if (!total) return 0;
  const earned = pieces.reduce((sum, piece) => {
    const mark = marks.find((item) => item.id === piece.id);
    const ratio = mark ? Math.min(1, Math.max(0, mark.ratio)) : 0;
    return sum + (piece.weight || 0) * ratio;
  }, 0);
  return Math.round((earned / total) * 100);
}
