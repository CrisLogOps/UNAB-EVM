"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useOrg } from "@/components/layout/OrgProvider";
import { KICKOFF_PHASE_LABEL, clientLabel } from "@/lib/kickoff";
import { ELEMENT_KIND_LABELS } from "@/lib/schedule-csv";
import type { GanttActivity } from "@/lib/types";

function formatDay(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

function activityRows(rows: GanttActivity[]) {
  return [...rows].sort((a, b) => a.code.localeCompare(b.code, "es", { numeric: true }));
}

export function ClientPortalView() {
  const params = useSearchParams();
  const router = useRouter();
  const { clients, projects, gantt, project, setProjectId } = useOrg();
  const requestedId = params.get("id") ?? "";
  const obraId = params.get("obra") ?? "";
  const fallbackId = project.id !== "prj-pending" ? project.clientId : "";
  const clientId = requestedId || fallbackId;
  const client = clients.find((item) => item.id === clientId);
  const works = projects.filter((item) => item.clientId === clientId && item.id !== "prj-pending");
  const obra = works.find((item) => item.id === obraId);
  const rows = obra ? activityRows(gantt.filter((item) => item.projectId === obra.id)) : [];
  useEffect(() => {
    if (requestedId || !fallbackId) return;
    router.replace(`/cliente?id=${fallbackId}`);
  }, [requestedId, fallbackId, router]);

  if (!client) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Vista del cliente</h1>
        <p className="mt-2 text-sm text-slate-600">
          Abre esta vista desde la ficha de un cliente. Así queda fijada a esa razón social y no muestra el resto de
          la cartera.
        </p>
        <Link href="/clients" className="mt-4 inline-block text-sm underline">
          Volver a Clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        Vista del mandante para <strong>{client.name}</strong>. Solo aparecen sus obras. No se muestra el presupuesto
        ni la cartera de los demás clientes.{" "}
        <Link href="/clients" className="underline">
          Volver a la cartera
        </Link>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Cliente</p>
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        <p className="text-sm text-slate-600">{clientLabel(client)}</p>
      </div>

      {obra ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <button
                type="button"
                className="text-sm underline"
                onClick={() => router.push(`/cliente?id=${client.id}`)}
              >
                Todas las obras de {client.name}
              </button>
              <h2 className="mt-1 text-lg font-semibold">
                {obra.name} <span className="font-normal text-slate-500">({obra.code})</span>
              </h2>
              <p className="text-sm text-slate-600">
                {formatDay(obra.startDate)} – {formatDay(obra.finishDate)} · {KICKOFF_PHASE_LABEL[obra.kickoffPhase]}
              </p>
            </div>
          </div>

          {rows.length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Código</th>
                    <th className="px-3 py-2 font-medium">Partida</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Inicio</th>
                    <th className="px-3 py-2 font-medium">Término</th>
                    <th className="px-3 py-2 font-medium">Avance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 text-slate-500">{row.code || "—"}</td>
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2">{ELEMENT_KIND_LABELS[row.elementKind]}</td>
                      <td className="px-3 py-2">{formatDay(row.start)}</td>
                      <td className="px-3 py-2">{formatDay(row.end)}</td>
                      <td className="px-3 py-2 tabular-nums">{Math.round(row.progress)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
              Esta obra todavía no tiene partidas en el cronograma. Cuando se carguen, el mandante las verá aquí, sin
              poder editarlas.
            </p>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Obras</h2>
          {works.length ? (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {works.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {item.name} <span className="font-normal text-slate-500">({item.code})</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDay(item.startDate)} – {formatDay(item.finishDate)} · {KICKOFF_PHASE_LABEL[item.kickoffPhase]}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs text-white"
                    onClick={() => {
                      setProjectId(item.id);
                      router.push(`/cliente?id=${client.id}&obra=${item.id}`);
                    }}
                  >
                    Ver cronograma
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
              Este cliente todavía no tiene obras asociadas.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
