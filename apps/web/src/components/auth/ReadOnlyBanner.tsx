"use client";

import { Eye } from "lucide-react";

export function ReadOnlyBanner({ responsible }: { responsible?: string }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
      <Eye className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Solo consulta. {responsible ? <strong>{responsible}</strong> : "El responsable"} edita esta
        parte. Tú la ves, sin cambiar su trabajo.
      </span>
    </div>
  );
}
