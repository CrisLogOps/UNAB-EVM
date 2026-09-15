"use client";

import { ROLE_LABELS } from "@/lib/constants";
import { handoverWarning } from "@/lib/handover";
import type { UserRole } from "@/lib/types";

export function HandoverConfirm({
  role,
  personName,
  checked,
  onChecked,
}: {
  role: UserRole;
  personName?: string;
  checked: boolean;
  onChecked: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(event) => onChecked(event.target.checked)}
      />
      <span>
        <span className="block font-semibold">
          {personName ? `Entregar el perfil a ${personName}` : `Entregar ${ROLE_LABELS[role]}`}
        </span>
        <span className="mt-1 block">{handoverWarning(role)}</span>
      </span>
    </label>
  );
}
