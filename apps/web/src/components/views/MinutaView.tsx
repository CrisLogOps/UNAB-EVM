"use client";

import { useState } from "react";
import { useOrg } from "@/components/layout/OrgProvider";
import { formatClp } from "@/lib/evm";
import { MINUTE_COST_LABEL, MINUTE_ORIGIN_LABEL, minuteTotals } from "@/lib/minutes";
import type { MinuteCostEffect, MinuteOrigin } from "@/lib/types";

export function MinutaView() {
  const { project, gantt, minutes, addMinute, canOperate, sessionUser } = useOrg();
  const canWrite = canOperate("evidence:upload") || canOperate("cost:edit");
  const rows = minutes
    .filter((item) => item.projectId === project.id)
    .slice()
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.recordedAt.localeCompare(a.recordedAt));
  const totals = minuteTotals(minutes, project.id);
  const activities = gantt.filter((item) => item.projectId === project.id);
  const [origin, setOrigin] = useState<MinuteOrigin>("mandante");
  const [issuer, setIssuer] = useState("");
  const [body, setBody] = useState("");
  const [occurredOn, setOccurredOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [activityId, setActivityId] = useState("");
  const [costEffect, setCostEffect] = useState<MinuteCostEffect>("gasto");
  const [amount, setAmount] = useState("");
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function save() {
    const ok = addMinute({
      origin,
      issuer: issuer || sessionUser.name,
      body,
      occurredOn,
      activityId,
      costEffect,
      amountClp: Number(amount) || 0,
      evidenceFileName: fileName,
    });
    if (!ok) {
      setMessage("Escribe la instrucción (al menos una frase). Si hay gasto o adicional, indica el monto.");
      return;
    }
    setBody("");
    setAmount("");
    setFileName("");
    setMessage(
      costEffect === "gasto"
        ? "Gasto anotado. Entra al costo real (AC) del valor ganado."
        : costEffect === "adicional"
          ? "Adicional anotado. Queda por cobrar y no se absorbe en el CPI."
          : "Minuta anotada, sin efecto en el costo.",
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Control de gasto</p>
        <h1 className="text-xl font-semibold sm:text-2xl">Minutas</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          {project.name} · {project.code}. Registro de la constructora: instrucción del mandante, del arquitecto o del
          equipo, y el gasto que produce. El gasto entra al costo real. El adicional queda aparte para cobrarlo y no
          se mezcla con el presupuesto vendido. El libro de obra oficial lo lleva el mandante.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Minutas</p>
          <p className="text-2xl font-semibold">{totals.count}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Gastos en el AC</p>
          <p className="text-2xl font-semibold">{formatClp(totals.gasto)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Adicionales por cobrar</p>
          <p className="text-2xl font-semibold">{formatClp(totals.adicional)}</p>
        </article>
      </section>

      {canWrite ? (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <h2 className="font-semibold">Nueva minuta</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Fecha</span>
              <input
                type="date"
                value={occurredOn}
                onChange={(event) => setOccurredOn(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Quién instruye</span>
              <select
                value={origin}
                onChange={(event) => setOrigin(event.target.value as MinuteOrigin)}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              >
                <option value="mandante">Mandante</option>
                <option value="arquitecto">Arquitecto</option>
                <option value="interno">Equipo de la obra</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Nombre</span>
              <input
                value={issuer}
                onChange={(event) => setIssuer(event.target.value)}
                placeholder={sessionUser.name}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Partida</span>
              <select
                value={activityId}
                onChange={(event) => setActivityId(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              >
                <option value="">Sin partida</option>
                {activities.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code ? `${item.code} · ` : ""}
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Efecto en el costo</span>
              <select
                value={costEffect}
                onChange={(event) => setCostEffect(event.target.value as MinuteCostEffect)}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              >
                <option value="gasto">Gasto de la obra (entra al AC)</option>
                <option value="adicional">Adicional por cobrar</option>
                <option value="sin_costo">Sin efecto en costo</option>
              </select>
            </label>
            {costEffect === "sin_costo" ? null : (
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Monto (CLP)</span>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                />
              </label>
            )}
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Instrucción</span>
            <textarea
              rows={3}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Qué se pidió cambiar y por qué mueve el gasto."
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Respaldo</span>
            <input
              type="file"
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
              className="w-full text-sm"
            />
            {fileName ? <span className="mt-1 block text-xs text-slate-500">{fileName}</span> : null}
          </label>
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
          >
            Guardar minuta
          </button>
        </section>
      ) : (
        <p className="text-sm text-slate-600">Solo consulta. Quien carga avance o gastos registra la minuta.</p>
      )}

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {rows.length ? (
          rows.map((item) => {
            const activity = activities.find((row) => row.id === item.activityId);
            return (
              <li key={item.id} className="space-y-1 px-4 py-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {item.occurredOn} · {MINUTE_ORIGIN_LABEL[item.origin]}
                  {item.issuer ? ` · ${item.issuer}` : ""}
                </p>
                <p>{item.body}</p>
                <p className="text-xs text-slate-600">
                  {MINUTE_COST_LABEL[item.costEffect]}
                  {item.amountClp > 0 ? ` · ${formatClp(item.amountClp)}` : ""}
                  {activity ? ` · ${activity.code || activity.name}` : ""}
                  {item.evidenceFileName ? ` · ${item.evidenceFileName}` : ""}
                </p>
              </li>
            );
          })
        ) : (
          <li className="px-4 py-6 text-sm text-slate-500">Todavía no hay minutas en esta obra.</li>
        )}
      </ul>
    </div>
  );
}
