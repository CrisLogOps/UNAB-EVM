"use client";

import { useState } from "react";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { QUALITY_TEMPLATES, activityQualityState, blockingActivityIds, qualityItemText, qualityListName } from "@/lib/quality";
import type { QualityGeo, QualityItemResult } from "@/lib/types";

function personName(users: { id: string; name: string; role: string }[], id: string) {
  const user = users.find((item) => item.id === id);
  if (!user) return "Sin registro";
  return user.name || ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || "Usuario";
}

function formatWhen(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function readGps(): Promise<QualityGeo | undefined> {
  if (!navigator.geolocation) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => resolve(undefined),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

export function QualityView() {
  const {
    project,
    gantt,
    users,
    sessionUser,
    qualityChecks,
    nonconformities,
    applyQualityTemplate,
    recordQualityItem,
    closeNonconformity,
    isIndividualMode,
  } = useOrg();
  const [notice, setNotice] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { note: string; dueOn: string; evidenceName: string; gps?: QualityGeo }>>({});
  const [closing, setClosing] = useState<Record<string, { note: string; evidenceName: string }>>({});
  const projectRows = gantt.filter((item) => item.projectId === project.id && item.elementKind !== "paquete");
  const inspections = projectRows.filter((item) => item.elementKind === "inspeccion" || item.requiresFieldEvidence);
  const activities = (inspections.length ? inspections : projectRows).sort((a, b) =>
    a.code.localeCompare(b.code, "es", { numeric: true }),
  );
  const checks = qualityChecks.filter((item) => item.projectId === project.id);
  const findings = nonconformities.filter((item) => item.projectId === project.id);
  const held = blockingActivityIds(findings);
  const openFindings = findings.filter((item) => item.status !== "closed");
  const closedFindings = findings.filter((item) => item.status === "closed");

  function draftFor(key: string) {
    return drafts[key] ?? { note: "", dueOn: new Date().toISOString().slice(0, 10), evidenceName: "" };
  }

  async function mark(
    checkId: string,
    itemId: string,
    result: Exclude<QualityItemResult, "pending">,
  ) {
    const draft = draftFor(itemId);
    if (result === "fail" && draft.note.trim().length < 8) {
      setNotice("Para dejar una observación escribe qué se encontró.");
      return;
    }
    const ok = recordQualityItem(checkId, itemId, result, {
      note: draft.note,
      dueOn: draft.dueOn,
      evidenceName: draft.evidenceName,
      gps: draft.gps,
    });
    setNotice(ok ? "Quedó registrado quién decidió y cuándo." : "No se pudo guardar el ítem.");
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Valor ganado y revisión</p>
        <h1 className="text-2xl font-semibold">¿Este trabajo ya se puede contar?</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          El plan (PV) sigue las fechas. El costo (AC) es lo que ya se gastó y esta pantalla no lo borra. El valor
          ganado (EV) es lo que ya se puede dar por hecho. Cada trabajo del cronograma puede llevar dos listas, en
          obra, en desarrollo o en una instalación: la de entrega pregunta si el resultado está listo, y la de
          condiciones pregunta si se puede seguir. Si un punto obligatorio no cumple, ese trabajo deja de sumar valor
          ganado hasta cerrar la observación con una nota o un archivo.
        </p>
      </div>

      {notice ? <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">{notice}</p> : null}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Observaciones que frenan el valor ganado</h2>
        {openFindings.length ? (
          <ul className="space-y-3">
            {openFindings.map((item) => {
              const activity = activities.find((row) => row.id === item.activityId);
              const form = closing[item.id] ?? { note: "", evidenceName: "" };
              return (
                <li key={item.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium">
                    {activity?.code ? `${activity.code} · ` : ""}
                    {activity?.name ?? "Trabajo"}
                  </p>
                  <p className="mt-1 text-sm">{qualityItemText(item.title)}</p>
                  <p className="mt-1 text-sm text-slate-700">{item.detail}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Responsable: {personName(users, item.ownerUserId)} · plazo {item.dueOn || "sin fecha"} · abierta por{" "}
                    {personName(users, item.openedBy)} el {formatWhen(item.openedAt)}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="text-sm">
                      <span className="mb-1 block font-medium">Cierre</span>
                      <input
                        value={form.note}
                        onChange={(event) =>
                          setClosing((current) => ({ ...current, [item.id]: { ...form, note: event.target.value } }))
                        }
                        placeholder="Qué se corrigió"
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium">Archivo de respaldo</span>
                      <input
                        type="file"
                        className="w-full text-sm"
                        onChange={(event) =>
                          setClosing((current) => ({
                            ...current,
                            [item.id]: { ...form, evidenceName: event.target.files?.[0]?.name ?? "" },
                          }))
                        }
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="mt-2 rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs text-white"
                    onClick={() => {
                      const ok = closeNonconformity(item.id, form);
                      setNotice(
                        ok
                          ? "La observación quedó cerrada. Este trabajo puede volver a sumar valor ganado."
                          : "Escribe qué se corrigió o adjunta un archivo.",
                      );
                    }}
                  >
                    Cerrar observación
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            No hay observaciones abiertas. Los trabajos con revisión pueden sumar valor ganado.
          </p>
        )}
        {closedFindings.length ? (
          <ul className="space-y-2">
            {closedFindings.map((item) => {
              const activity = activities.find((row) => row.id === item.activityId);
              return (
                <li key={item.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <p className="font-medium">
                    {activity?.code ? `${activity.code} · ` : ""}
                    {qualityItemText(item.title)}
                  </p>
                  <p className="mt-1 text-slate-700">{item.closeNote}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Cerrada por {personName(users, item.decisions.at(-1)?.by ?? "")} el {formatWhen(item.closedAt ?? "")}
                    {item.closeEvidenceName ? ` · archivo ${item.closeEvidenceName}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Trabajos</h2>
        {activities.length ? (
          activities.map((activity) => {
            const mine = checks.filter((item) => item.activityId === activity.id);
            const state = activityQualityState(activity.id, mine, held);
            return (
              <article key={activity.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {activity.code ? `${activity.code} · ` : ""}
                      {activity.name}
                    </p>
                    <p className="text-xs text-slate-500">{state}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUALITY_TEMPLATES.filter((template) => !mine.some((item) => item.templateId === template.id)).map(
                      (template) => (
                        <button
                          key={template.id}
                          type="button"
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          onClick={() => {
                            const ok = applyQualityTemplate(activity.id, template.id);
                            setNotice(ok ? `${template.name} quedó en ${activity.code || activity.name}.` : "Esa lista ya está en este trabajo.");
                          }}
                        >
                          <span className="block font-medium">Agregar {template.name.toLowerCase()}</span>
                          <span className="mt-0.5 block font-normal text-slate-500">{template.hint}</span>
                        </button>
                      ),
                    )}
                  </div>
                </div>
                {mine.map((check) => (
                  <div key={check.id} className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-sm font-medium">{qualityListName(check.templateName)}</p>
                    <ul className="mt-2 space-y-3">
                      {check.items.map((item) => {
                        const draft = draftFor(item.id);
                        return (
                          <li key={item.id} className="rounded-lg bg-slate-50 p-3">
                            <p className="text-sm">{qualityItemText(item.text)}</p>
                            <p className="text-xs text-slate-500">
                              {item.blocking
                                ? "Si no cumple, este trabajo no suma valor ganado"
                                : "Si no corresponde, marca No aplica"}
                              {item.recordedAt
                                ? ` · ${personName(users, item.recordedBy)} · ${formatWhen(item.recordedAt)} · ${
                                    item.result === "ok" ? "cumple" : item.result === "fail" ? "no cumple" : item.result === "na" ? "no aplica" : "pendiente"
                                  }`
                                : ""}
                            </p>
                            {item.gps ? (
                              <p className="text-xs text-slate-600">
                                Ubicación {item.gps.lat.toFixed(5)}, {item.gps.lng.toFixed(5)} · precisión{" "}
                                {Math.round(item.gps.accuracy)} m
                              </p>
                            ) : null}
                            {item.evidenceName ? <p className="text-xs text-slate-600">Archivo: {item.evidenceName}</p> : null}
                            {item.note ? <p className="mt-1 text-sm text-slate-700">{item.note}</p> : null}
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <input
                                value={draft.note}
                                onChange={(event) =>
                                  setDrafts((current) => ({ ...current, [item.id]: { ...draft, note: event.target.value } }))
                                }
                                placeholder="Observación, si hace falta"
                                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                              />
                              <input
                                type="date"
                                value={draft.dueOn}
                                onChange={(event) =>
                                  setDrafts((current) => ({ ...current, [item.id]: { ...draft, dueOn: event.target.value } }))
                                }
                                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                              />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <label className="text-xs text-slate-600">
                                Archivo
                                <input
                                  type="file"
                                  accept="image/*,video/*,audio/*,.pdf"
                                  className="ml-2 text-xs"
                                  onChange={(event) =>
                                    setDrafts((current) => ({
                                      ...current,
                                      [item.id]: { ...draft, evidenceName: event.target.files?.[0]?.name ?? "" },
                                    }))
                                  }
                                />
                              </label>
                              <button
                                type="button"
                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                                onClick={() => {
                                  void readGps().then((gps) => {
                                    setDrafts((current) => ({ ...current, [item.id]: { ...draftFor(item.id), gps } }));
                                    setNotice(
                                      gps
                                        ? "Ubicación lista. Queda a la vista en este ítem."
                                        : "El dispositivo no entregó la ubicación. El ítem igual se puede registrar.",
                                    );
                                  });
                                }}
                              >
                                Tomar ubicación
                              </button>
                              <button
                                type="button"
                                className="rounded-md bg-[var(--brand)] px-2 py-1 text-xs text-white"
                                onClick={() => void mark(check.id, item.id, "ok")}
                              >
                                Cumple
                              </button>
                              {!item.blocking ? (
                                <button
                                  type="button"
                                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                                  onClick={() => void mark(check.id, item.id, "na")}
                                >
                                  No aplica
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs"
                                onClick={() => void mark(check.id, item.id, "fail")}
                              >
                                No cumple
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </article>
            );
          })
        ) : (
          <p className="text-sm text-slate-600">Este proyecto todavía no tiene trabajos para revisar.</p>
        )}
      </section>
      {isIndividualMode ? (
        <p className="text-xs text-slate-500">
          En modo independiente cierras tú la observación. El punto que no cumplió y quién lo cerró quedan en el historial.
          Ahora estás como {sessionUser.name || "profesional"}.
        </p>
      ) : null}
    </div>
  );
}
