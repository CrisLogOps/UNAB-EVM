"use client";

import { useMemo, useState } from "react";
import { SCurveChart } from "@/components/charts/SCurveChart";
import { useOrg } from "@/components/layout/OrgProvider";
import { formatClp } from "@/lib/evm";
import { weeklyReadings, type WeekReading } from "@/lib/evm-project";
import { minuteAcRows } from "@/lib/minutes";
import { appChannel } from "@/lib/operating-mode";
import { datesForCadence, PAYMENT_CADENCES } from "@/lib/payment-cuts";
import type { PaymentCadence, PaymentCut } from "@/lib/types";

function money(value: number | null) {
  if (value == null) return "—";
  return formatClp(value);
}

function percent(value: number | null) {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

export function PaymentCutsPanel() {
  const {
    project,
    role,
    gantt,
    reports,
    minutes,
    kickoffFor,
    paymentCuts,
    addPaymentCut,
    applyPaymentCadence,
    removePaymentCut,
    closePaymentCut,
  } = useOrg();
  const kickoff = kickoffFor(project.id);
  const cuts = paymentCuts.filter((item) => item.projectId === project.id);
  const activities = useMemo(
    () => gantt.filter((item) => item.projectId === project.id),
    [gantt, project.id],
  );
  const acRows = useMemo(() => minuteAcRows(minutes, project.id), [minutes, project.id]);
  const today = new Date().toISOString().slice(0, 10);
  const weeks = useMemo(
    () =>
      weeklyReadings(
        project,
        activities,
        reports,
        role,
        today,
        acRows,
        cuts.map((item) => item.dueDate),
      ),
    [project, activities, reports, role, today, acRows, cuts],
  );
  const byDate = new Map(cuts.map((item) => [item.dueDate, item]));
  const [dueDate, setDueDate] = useState("");
  const [label, setLabel] = useState("");
  const [cadence, setCadence] = useState<PaymentCadence>("month_early");
  const [message, setMessage] = useState("");
  const isAdmin = role === "owner";
  const variablePayments = appChannel() === "development";
  const preview = variablePayments ? datesForCadence(project.startDate, project.finishDate, cadence) : [];

  const economic = weeks.map((week) => pointOf(week, byDate.get(week.date), "money"));
  const physical = weeks.map((week) => pointOf(week, byDate.get(week.date), "percent"));

  function addCut() {
    const name = label.trim() || `Estado de pago ${cuts.length + 1}`;
    const ok = addPaymentCut(project.id, dueDate, name);
    setMessage(ok ? `${name} quedó en el corte del ${dueDate}.` : "Esa fecha ya tiene un estado de pago.");
    if (ok) {
      setDueDate("");
      setLabel("");
    }
  }

  function closeCut(cut: PaymentCut, week: WeekReading | undefined) {
    if (!week || week.ev == null || week.ac == null) return;
    const ok = closePaymentCut(cut.id, {
      pv: week.pv,
      ev: week.ev,
      ac: week.ac,
      physicalPercent: week.physicalPercent ?? 0,
    });
    setMessage(ok ? `${cut.label} quedó cerrado con la lectura de esa fecha.` : "Ese estado ya estaba cerrado.");
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Cortes semanales y estados de pago</h2>
        <p className="mt-1 text-xs text-slate-500">
          Cada punto es una semana. El valor planificado sigue las fechas. El valor ganado de una semana
          anterior sale de los avances aceptados hasta esa fecha, y el costo real suma gastos de minuta
          hasta esa fecha. Cerrar un estado de pago guarda esa lectura: el valor ganado y el costo real no
          se vuelven a calcular.
        </p>
      </div>

      <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        {kickoff?.clientConfirmedAt && kickoff.paymentsAgreed
          ? `En el kickoff del ${kickoff.clientDate || "cliente"} se fijaron plazos de pago. Esas fechas marcan los estados de pago.`
          : kickoff?.clientConfirmedAt && kickoff.paymentsAgreed === false
            ? "En el kickoff no se fijaron plazos. El administrador los agrega aquí para marcar los estados de pago sobre el corte semanal."
            : "Los plazos se conversan en el kickoff con el cliente. Si esa reunión no los deja, el administrador los agrega igual."}
        {kickoff?.paymentNote ? ` ${kickoff.paymentNote}` : ""}
      </p>

      {isAdmin && variablePayments ? (
        <form
          className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"
          onSubmit={(event) => {
            event.preventDefault();
            const result = applyPaymentCadence(project.id, cadence);
            setMessage(
              result.ok
                ? `Quedaron ${result.count} estados entre el inicio y el término. Un estado ya cerrado no se mueve.`
                : result.message,
            );
          }}
        >
          <p className="text-sm font-medium text-slate-800">Plazo variable</p>
          <p className="text-xs text-slate-600">
            Días fijos del 1 al 28. El 29 y el 30 no se usan, así febrero y los meses cortos calzan.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {PAYMENT_CADENCES.map((item) => (
              <label key={item.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2 text-sm">
                <input
                  type="radio"
                  name="dashboardCadence"
                  className="mt-1"
                  checked={cadence === item.id}
                  onChange={() => setCadence(item.id)}
                />
                <span>
                  <span className="font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-600">{item.detail}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            {preview.length
              ? `${preview.length} estados, del ${preview[0]} al ${preview[preview.length - 1]}.`
              : "Esta obra no tiene un tramo donde caiga ese día."}
          </p>
          <button
            type="submit"
            className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
          >
            Armar estados
          </button>
        </form>
      ) : null}

      {isAdmin ? (
        <form
          className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[auto_1fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            addCut();
          }}
        >
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-slate-600">Fecha del estado de pago</span>
            <input
              type="date"
              lang="es-CL"
              required
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-slate-600">Nombre</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={`Estado de pago ${cuts.length + 1}`}
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
          >
            Agregar
          </button>
        </form>
      ) : (
        <p className="text-xs text-slate-500">El administrador agrega las fechas de estado de pago.</p>
      )}
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}

      <SCurveChart
        data={economic}
        unit="money"
        title="Curva económica · Planificado (PV) · Valor ganado (EV) · Costo real (AC)"
      />
      <SCurveChart
        data={physical}
        unit="percent"
        title="Curva física · % planificado · % ganado · % de costo real"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Semana</th>
              <th className="px-3 py-2 font-medium">PV</th>
              <th className="px-3 py-2 font-medium">EV</th>
              <th className="px-3 py-2 font-medium">AC</th>
              <th className="px-3 py-2 font-medium">Físico</th>
              <th className="px-3 py-2 font-medium">Estado de pago</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => {
              const cut = byDate.get(week.date);
              const closed = Boolean(cut?.frozenAt);
              const shown = closed && cut ? cut : null;
              return (
                <tr key={week.date} className={cut ? "bg-emerald-50/60" : undefined}>
                  <td className="px-3 py-2 whitespace-nowrap">{week.period}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{money(shown?.pv ?? week.pv)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{money(shown?.ev ?? week.ev)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{money(shown?.ac ?? week.ac)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {percent(shown?.physicalPercent ?? week.physicalPercent)}
                  </td>
                  <td className="px-3 py-2">
                    {cut ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span>
                          {cut.label}
                          {closed ? " · cerrado" : week.date > today ? " · programado" : " · abierto"}
                        </span>
                        {isAdmin && !closed && week.date <= today && week.ev != null ? (
                          <button
                            type="button"
                            onClick={() => closeCut(cut, week)}
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-white"
                          >
                            Cerrar con esta lectura
                          </button>
                        ) : null}
                        {isAdmin && !closed ? (
                          <button
                            type="button"
                            onClick={() => {
                              removePaymentCut(cut.id);
                              setMessage(`${cut.label} se quitó. La curva semanal sigue.`);
                            }}
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-white"
                          >
                            Quitar
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-slate-400">{week.current ? "Semana en curso" : "—"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function pointOf(week: WeekReading, cut: PaymentCut | undefined, unit: "money" | "percent") {
  const closed = Boolean(cut?.frozenAt && cut.pv != null && cut.ev != null && cut.ac != null);
  const pv = closed ? cut!.pv! : week.pv;
  const ev = closed ? cut!.ev : week.ev;
  const ac = closed ? cut!.ac : week.ac;
  if (unit === "money") return { period: week.period, pv, ev, ac };
  const bac = week.bac;
  return {
    period: week.period,
    pv: bac > 0 ? (pv / bac) * 100 : 0,
    ev: ev == null || bac <= 0 ? null : (ev / bac) * 100,
    ac: ac == null || bac <= 0 ? null : (ac / bac) * 100,
  };
}
