"use client";

import { TrendingDown, TrendingUp, Lock } from "lucide-react";
import type { AlertStatus } from "@/lib/types";

const STATUS_STYLES: Record<AlertStatus, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  yellow: "border-amber-200 bg-amber-50 text-amber-900",
  red: "border-red-200 bg-red-50 text-red-900",
};

const DOT: Record<AlertStatus, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
};

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  status: AlertStatus;
  trend?: "up" | "down" | "flat";
  locked?: boolean;
}

export function KpiCard({ label, value, hint, status, trend, locked }: KpiCardProps) {
  return (
    <article className={`rounded-xl border p-4 shadow-sm ${STATUS_STYLES[status]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${DOT[status]}`} />
      </div>
      <p className="mt-2 font-mono text-xl font-semibold tracking-tight break-all sm:text-2xl">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
        {locked ? <Lock className="h-3.5 w-3.5" /> : null}
        {trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : null}
        {trend === "down" ? <TrendingDown className="h-3.5 w-3.5" /> : null}
        <span>{hint}</span>
      </div>
    </article>
  );
}
