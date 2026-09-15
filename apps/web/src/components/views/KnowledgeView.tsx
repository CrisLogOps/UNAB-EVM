"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { REVIEW_STANCE_OPTIONS } from "@/lib/kickoff";

export function KnowledgeView() {
  const { knowledge, areas } = useOrg();
  const [query, setQuery] = useState("");
  const [areaId, setAreaId] = useState("");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...knowledge]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .filter((item) => {
        if (areaId && item.areaId !== areaId) return false;
        if (!needle) return true;
        return `${item.comment} ${item.proposalTitle} ${item.projectName} ${item.clientName} ${item.areaName}`
          .toLowerCase()
          .includes(needle);
      });
  }, [knowledge, query, areaId]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Aprendizaje de kickoff</p>
        <h1 className="text-2xl font-semibold">Base de conocimiento</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Cada razón escrita de área en el kickoff interno queda acá para decidir obras futuras. Un documento
          adjunto es opcional.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Buscar</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Propuesta, comentario, cliente…"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Área</span>
          <select
            value={areaId}
            onChange={(event) => setAreaId(event.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          >
            <option value="">Todas</option>
            {areas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {item.areaName} · {ROLE_LABELS[item.role]} ·{" "}
                {REVIEW_STANCE_OPTIONS.find((entry) => entry.id === item.stance)?.label ?? item.stance}
              </p>
              <p className="mt-1 font-medium">{item.proposalTitle || "Propuesta de kickoff"}</p>
              <p className="text-sm text-slate-600">
                {item.projectName}
                {item.clientName ? ` · ${item.clientName}` : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{item.comment}</p>
              {item.evidenceFileName ? (
                <p className="mt-2 text-xs text-slate-500">Documento (opcional): {item.evidenceFileName}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          Aún no hay registros. Se crean cuando las áreas comentan la propuesta en el kickoff interno.
        </p>
      )}

      <p className="text-xs text-slate-500">
        Volver a{" "}
        <Link href="/demo" className="underline">
          Inicio
        </Link>{" "}
        o al{" "}
        <Link href="/clients" className="underline">
          kickoff
        </Link>
        .
      </p>
    </div>
  );
}
