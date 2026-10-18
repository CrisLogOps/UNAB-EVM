"use client";

import {
  CartesianGrid,
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
        Aún no hay curva S. Carga el cronograma EDT para planificar PV y medir valor ganado.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">
        <span className="sm:hidden">Curva S</span>
        <span className="hidden sm:inline">Curva S · Planificado (PV) · Valor ganado (EV) · Costo real (AC)</span>
      </h3>
      <div className="h-44 w-full min-w-0 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis
              width={36}
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
            <Line type="monotone" dataKey="pv" name="PV planificado" stroke="#0b4a44" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ev" name="EV valor ganado" stroke="#2ecc71" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ac" name="AC costo real" stroke="#b91c1c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#b91c1c]" />
          AC costo real
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#2ecc71]" />
          EV valor ganado
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#0b4a44]" />
          PV planificado
        </li>
      </ul>
    </div>
  );
}
