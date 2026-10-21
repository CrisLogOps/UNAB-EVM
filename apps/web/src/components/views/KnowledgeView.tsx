"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { REVIEW_STANCE_OPTIONS } from "@/lib/kickoff";
import type { KnowledgeEntry, KnowledgeMoment, KnowledgeScope, KnowledgeSource } from "@/lib/types";

const SCOPE_LABEL: Record<KnowledgeScope, string> = {
  empresa: "Empresa",
  cliente: "Cliente",
  proyecto: "Proyecto",
};

const MOMENT_LABEL: Record<KnowledgeMoment, string> = {
  antes: "Antes de empezar",
  durante: "Durante la obra",
  cierre: "Al finalizar",
};

const SOURCE_LABEL: Record<KnowledgeSource, string> = {
  kickoff: "Kickoff",
  paquete: "Cierre de paquete",
  manual: "Registro",
  presupuesto: "Presupuesto",
};

function presented(item: KnowledgeEntry) {
  const source = item.source ?? "kickoff";
  return {
    scope: item.scope ?? "proyecto",
    moment: item.moment ?? (source === "paquete" ? "durante" : "antes"),
    source,
  };
}

export function KnowledgeView() {
  const { knowledge, areas, clients, projects, project, tenant, addKnowledgeRecord } = useOrg();
  const [query, setQuery] = useState("");
  const [areaId, setAreaId] = useState("");
  const [scope, setScope] = useState<KnowledgeScope | "">("");
  const [moment, setMoment] = useState<KnowledgeMoment | "">("");
  const [draftScope, setDraftScope] = useState<KnowledgeScope>("proyecto");
  const [draftMoment, setDraftMoment] = useState<KnowledgeMoment>("durante");
  const [draftClientId, setDraftClientId] = useState("");
  const [draftProjectId, setDraftProjectId] = useState(project.id && project.id !== "prj-pending" ? project.id : "");
  const [draftComment, setDraftComment] = useState("");
  const [draftFile, setDraftFile] = useState("");
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...knowledge]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .filter((item) => {
        const view = presented(item);
        if (areaId && item.areaId !== areaId) return false;
        if (scope && view.scope !== scope) return false;
        if (moment && view.moment !== moment) return false;
        if (!needle) return true;
        return `${item.comment} ${item.proposalTitle} ${item.projectName} ${item.clientName} ${item.areaName} ${item.activityCode ?? ""} ${item.activityName ?? ""}`
          .toLowerCase()
          .includes(needle);
      });
  }, [knowledge, query, areaId, scope, moment]);

  function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = addKnowledgeRecord({
      scope: draftScope,
      moment: draftMoment,
      comment: draftComment,
      evidenceFileName: draftFile,
      clientId: draftScope === "cliente" ? draftClientId : undefined,
      projectId: draftScope === "proyecto" ? draftProjectId : undefined,
    });
    setNotice({
      ok,
      text: ok
        ? "Registro guardado. Queda en esta base para consultarlo en otra obra."
        : "Escribe al menos 8 caracteres y elige el cliente o el proyecto cuando corresponda.",
    });
    if (!ok) return;
    setDraftComment("");
    setDraftFile("");
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Aprendizaje de la obra</p>
        <h1 className="text-2xl font-semibold">Base de conocimiento</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Aquí quedan los registros de la empresa, de un cliente o de un proyecto: antes de empezar, durante la
          obra y al finalizar. Al completar un paquete, la razón o el archivo también entra como registro del
          proyecto durante la obra. Los comentarios del kickoff siguen en la misma lista.
        </p>
      </div>

      <form onSubmit={saveRecord} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">Nuevo registro</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">De quién es</span>
            <select
              value={draftScope}
              onChange={(event) => setDraftScope(event.target.value as KnowledgeScope)}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            >
              {(Object.keys(SCOPE_LABEL) as KnowledgeScope[]).map((key) => (
                <option key={key} value={key}>
                  {SCOPE_LABEL[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Momento</span>
            <select
              value={draftMoment}
              onChange={(event) => setDraftMoment(event.target.value as KnowledgeMoment)}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            >
              {(Object.keys(MOMENT_LABEL) as KnowledgeMoment[]).map((key) => (
                <option key={key} value={key}>
                  {MOMENT_LABEL[key]}
                </option>
              ))}
            </select>
          </label>
          {draftScope === "cliente" ? (
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Cliente</span>
              <select
                value={draftClientId}
                onChange={(event) => setDraftClientId(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              >
                <option value="">Elegir cliente</option>
                {clients.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {draftScope === "proyecto" ? (
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Proyecto</span>
              <select
                value={draftProjectId}
                onChange={(event) => setDraftProjectId(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
              >
                <option value="">Elegir proyecto</option>
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {draftScope === "empresa" ? (
            <p className="text-sm text-slate-600 sm:col-span-2">
              Queda en {tenant.name || "la empresa"} y se puede consultar desde cualquier obra.
            </p>
          ) : null}
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Qué conviene recordar</span>
          <textarea
            value={draftComment}
            onChange={(event) => setDraftComment(event.target.value)}
            rows={3}
            placeholder="Qué se hizo, qué se decidió o por qué se cerró"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Archivo (opcional)</span>
          <input
            type="file"
            onChange={(event) => setDraftFile(event.target.files?.[0]?.name ?? "")}
            className="w-full text-sm"
          />
          {draftFile ? <span className="mt-1 block text-xs text-slate-500">{draftFile}</span> : null}
        </label>
        <button type="submit" className="min-h-11 rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white">
          Guardar registro
        </button>
      </form>

      {notice ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            notice.ok ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Buscar</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Razón, cliente, paquete…"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Ámbito</span>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as KnowledgeScope | "")}
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          >
            <option value="">Todos</option>
            {(Object.keys(SCOPE_LABEL) as KnowledgeScope[]).map((key) => (
              <option key={key} value={key}>
                {SCOPE_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Momento</span>
          <select
            value={moment}
            onChange={(event) => setMoment(event.target.value as KnowledgeMoment | "")}
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          >
            <option value="">Todos</option>
            {(Object.keys(MOMENT_LABEL) as KnowledgeMoment[]).map((key) => (
              <option key={key} value={key}>
                {MOMENT_LABEL[key]}
              </option>
            ))}
          </select>
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
          {rows.map((item) => {
            const view = presented(item);
            return (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {SCOPE_LABEL[view.scope]} · {MOMENT_LABEL[view.moment]} · {SOURCE_LABEL[view.source]}
                  {view.source === "kickoff"
                    ? ` · ${item.areaName} · ${ROLE_LABELS[item.role]} · ${
                        REVIEW_STANCE_OPTIONS.find((entry) => entry.id === item.stance)?.label ?? item.stance
                      }`
                    : ""}
                </p>
                <p className="mt-1 font-medium">{item.proposalTitle || "Registro"}</p>
                <p className="text-sm text-slate-600">
                  {[item.projectName, item.clientName, item.activityCode].filter(Boolean).join(" · ")}
                </p>
                {item.activityName ? <p className="text-xs text-slate-500">{item.activityName}</p> : null}
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{item.comment}</p>
                {item.evidenceFileName ? (
                  <p className="mt-2 text-xs text-slate-500">Archivo: {item.evidenceFileName}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          Aún no hay registros con ese filtro. Puedes anotar uno arriba, o completar un paquete en Avance con una
          razón o un archivo.
        </p>
      )}

      <p className="text-xs text-slate-500">
        Volver a{" "}
        <Link href="/demo" className="underline">
          Inicio
        </Link>{" "}
        o a{" "}
        <Link href="/progress" className="underline">
          Avance
        </Link>
        .
      </p>
    </div>
  );
}
