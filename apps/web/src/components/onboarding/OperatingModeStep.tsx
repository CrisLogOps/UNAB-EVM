"use client";

import { useState } from "react";
import { ACTIVITY_TYPES } from "@/lib/tenant-setup";
import { OPERATING_MODE_OPTIONS, type OperatingMode } from "@/lib/operating-mode";

export function OperatingModeStep({
  company,
  activityType,
  operatingMode,
  onBack,
  onSubmit,
}: {
  company: string;
  activityType: string;
  operatingMode: OperatingMode | "";
  onBack: () => void;
  onSubmit: (payload: { operatingMode: OperatingMode; activityType: string }) => void;
}) {
  const [mode, setMode] = useState<OperatingMode | "">(operatingMode);
  const [activity, setActivity] = useState(
    activityType && ACTIVITY_TYPES.some((item) => item.id === activityType) ? activityType : activityType ? "otro" : "",
  );
  const [activityOther, setActivityOther] = useState(
    activityType && !ACTIVITY_TYPES.some((item) => item.id === activityType) ? activityType : "",
  );
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!mode) {
      setError("Elige si trabajas solo o con equipo.");
      return;
    }
    if (mode === "individual") {
      if (!activity || (activity === "otro" && !activityOther.trim())) {
        setError("En la versión individual indica el tipo de actividad.");
        return;
      }
    }
    onSubmit({
      operatingMode: mode,
      activityType: activity === "otro" ? activityOther.trim() : activity,
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Paso 2 · Setup 0</p>
        <h1 className="text-xl font-semibold sm:text-2xl">Cómo vas a trabajar</h1>
        <p className="mt-2 text-sm text-slate-600">
          {company || "Tu empresa"}: elige la versión. El ciclo de la obra es el mismo; cambia si gestionas
          usuarios y áreas. Después podrás pasar de individual a colaborativo desde el panel.
        </p>
      </div>

      <div className="grid gap-3">
        {OPERATING_MODE_OPTIONS.map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMode(item.id);
                setError(null);
              }}
              className={`rounded-xl border p-4 text-left ${
                active ? "border-[var(--brand)] bg-slate-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.subtitle}</p>
              <p className="font-semibold">{item.label}</p>
              <p className="mt-2 text-sm text-slate-700">{item.description}</p>
              <p className="mt-2 text-xs text-slate-500">{item.howItWorks}</p>
            </button>
          );
        })}
      </div>

      {mode === "individual" ? (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-medium">Actividad (versión individual)</p>
          <p className="text-xs text-slate-500">
            No se registran usuarios ni áreas. Entras a Inicio para cliente, proyecto y control de obra.
          </p>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Tipo de actividad</span>
            <select
              required
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            >
              <option value="">Selecciona una actividad</option>
              {ACTIVITY_TYPES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {activity === "otro" ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Describe la actividad</span>
              <input
                value={activityOther}
                onChange={(event) => setActivityOther(event.target.value)}
                placeholder="Ej. inspección técnica de obras"
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {mode === "collaborative" ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Siguiente: actividad, tamaño por cantidad de áreas y un contacto por área (además de Dirección).
          El alta pide al menos un segundo usuario.
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Volver a empresa
        </button>
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
        >
          {mode === "individual" ? "Entrar a clientes y proyectos" : "Continuar a actividad y áreas"}
        </button>
      </div>
    </div>
  );
}
