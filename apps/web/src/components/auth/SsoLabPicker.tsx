"use client";

import { useState } from "react";
import { SSO_LAB_PROFILES, SSO_PROVIDERS, type SsoLabProfile, type SsoProvider } from "@/lib/identity";

export function SsoLabPicker({
  onSelect,
}: {
  onSelect: (provider: Exclude<SsoProvider, "email">, profile: SsoLabProfile) => void;
}) {
  const [open, setOpen] = useState<Exclude<SsoProvider, "email"> | null>(null);

  return (
    <div className="space-y-2">
      {SSO_PROVIDERS.map((item) => (
        <div key={item.id} className="space-y-2">
          <button
            type="button"
            onClick={() => setOpen((current) => (current === item.id ? null : item.id))}
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            {item.label}
          </button>
          {open === item.id ? (
            <ul className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
              {SSO_LAB_PROFILES[item.id].map((profile) => (
                <li key={profile.email}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id, profile)}
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-white"
                  >
                    <span className="block font-medium">{profile.name}</span>
                    <span className="block text-xs text-slate-500">{profile.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
      <p className="text-xs text-slate-500">Laboratorio: no hay OAuth real. Elegí una cuenta de prueba de Gmail o Microsoft.</p>
    </div>
  );
}
