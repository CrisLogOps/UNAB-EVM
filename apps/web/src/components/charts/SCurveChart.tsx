"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SCurvePoint } from "@/lib/types";

function formatAxis(value: number, money: boolean) {
  if (!money) return `${Math.round(value)}`;
  if (Math.abs(value) >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)} mil`;
  return `${Math.round(value)}`;
}

export function SCurveChart({
  data,
  moneyMode = true,
}: {
  data: SCurvePoint[];
  moneyMode?: boolean;
}) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        Aún no hay curva S. Carga el cronograma EDT en Calendario para planificar PV y medir valor ganado.
      </div>
    );
  }

  return (
    <div className="h-56 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:h-80 sm:p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        Curva S · Planificado (PV) · Valor ganado (EV) · Costo real (AC)
      </h3>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" tick={{ fontSize: 10 }} />
          <YAxis
            width={44}
            tick={{ fontSize: 10 }}
            tickFormatter={(value: number) => formatAxis(value, moneyMode)}
          />
          <Tooltip
            formatter={(value) =>
              moneyMode
                ? new Intl.NumberFormat("es-CL", {
                    style: "currency",
                    currency: "CLP",
                    maximumFractionDigits: 0,
                  }).format(Number(value))
                : `${Math.round(Number(value))} (esfuerzo planificado)`
            }
          />
          <Legend />
          <Line type="monotone" dataKey="pv" name="PV planificado" stroke="#0b4a44" strokeWidth={2} dot />
          <Line type="monotone" dataKey="ev" name="EV valor ganado" stroke="#2ecc71" strokeWidth={2} dot />
          <Line type="monotone" dataKey="ac" name="AC costo real" stroke="#b91c1c" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
