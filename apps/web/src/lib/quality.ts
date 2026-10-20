import type { QualityCheck, QualityTemplate } from "./types";

/** Listas de revisión. Se copian al trabajo y cada punto se puede marcar como no aplica si no frena el valor ganado. */
export const QUALITY_TEMPLATES: QualityTemplate[] = [
  {
    id: "tpl-calidad-liberacion",
    family: "calidad",
    name: "Revisión de entrega",
    hint: "¿El resultado está listo para contarlo como hecho?",
    items: [
      {
        id: "alcance",
        text: "El trabajo coincide con lo que se acordó.",
        blocking: true,
      },
      {
        id: "ejecucion",
        text: "Lo acordado está hecho, sin faltantes visibles.",
        blocking: true,
      },
      {
        id: "evidencia",
        text: "El archivo o la foto identifican este trabajo y esta fecha.",
        blocking: true,
      },
      {
        id: "observaciones",
        text: "No quedan observaciones abiertas de esta revisión.",
        blocking: true,
      },
    ],
  },
  {
    id: "tpl-seguridad-frente",
    family: "seguridad",
    name: "Condiciones de trabajo",
    hint: "¿Se puede seguir sin un riesgo que obligue a parar?",
    items: [
      {
        id: "acceso",
        text: "Hay acceso y está claro dónde se trabaja.",
        blocking: true,
      },
      {
        id: "caida",
        text: "Si este trabajo tiene un riesgo propio del lugar, está controlado.",
        blocking: false,
      },
      {
        id: "epp",
        text: "Quien trabaja usa la protección que corresponde.",
        blocking: true,
      },
      {
        id: "detener",
        text: "No hay una condición que obligue a detener el trabajo.",
        blocking: true,
      },
    ],
  },
];

const LEGACY_LIST_NAME: Record<string, string> = {
  "Liberación de partida": "Revisión de entrega",
  "Condiciones del frente": "Condiciones de trabajo",
};

const LEGACY_ITEM_TEXT: Record<string, string> = {
  "La partida coincide con el plano o la especificación vigente.": "El trabajo coincide con lo que se acordó.",
  "El alcance indicado está ejecutado, sin faltantes visibles.": "Lo acordado está hecho, sin faltantes visibles.",
  "La foto o el archivo identifican esta partida y esta fecha.": "El archivo o la foto identifican este trabajo y esta fecha.",
  "El frente tiene acceso y señalización para trabajar.": "Hay acceso y está claro dónde se trabaja.",
  "Hay protección contra caída, o esta partida no la requiere.": "Si este trabajo tiene un riesgo propio del lugar, está controlado.",
  "Quien está en el frente usa la protección que corresponde.": "Quien trabaja usa la protección que corresponde.",
  "No hay una condición insegura que deba detener la partida.": "No hay una condición que obligue a detener el trabajo.",
};

export function qualityListName(name: string) {
  return LEGACY_LIST_NAME[name] ?? name;
}

export function qualityItemText(text: string) {
  return LEGACY_ITEM_TEXT[text] ?? text;
}

export function qualityTemplate(id: string) {
  return QUALITY_TEMPLATES.find((item) => item.id === id);
}

export function blockingActivityIds(items: { activityId: string; blocking: boolean; status: string }[]) {
  return new Set(items.filter((item) => item.blocking && item.status !== "closed").map((item) => item.activityId));
}

export function activityQualityState(
  activityId: string,
  checks: QualityCheck[],
  openBlockingActivityIds: Set<string>,
) {
  const mine = checks.filter((item) => item.activityId === activityId);
  if (!mine.length) return "Sin revisión";
  if (openBlockingActivityIds.has(activityId)) return "Observación abierta";
  const pending = mine.some((check) => check.items.some((item) => item.blocking && item.result === "pending"));
  if (pending) return "Revisión en curso";
  return "Aceptada";
}
