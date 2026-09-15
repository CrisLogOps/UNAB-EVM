"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientKickoffAssistant } from "@/components/onboarding/ClientKickoffAssistant";
import { useOrg } from "@/components/layout/OrgProvider";
import { KICKOFF_PHASE_LABEL, clientLabel } from "@/lib/kickoff";

export function ClientsView() {
  const { clients, projects, setProjectId, canOperate, role } = useOrg();
  const router = useRouter();
  const [creating, setCreating] = useState(!clients.length);
  const [resumeId, setResumeId] = useState<string | undefined>();
  const canEdit = canOperate("project:manager") || role === "owner";

  if (creating) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Después de armar la empresa</p>
          <h1 className="text-2xl font-semibold">Clientes y kickoff</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Registra al cliente y el proyecto. En el kickoff interno, Comercial adjunta la propuesta
            inicial; todas las áreas comentan el mismo documento; el gestor arma la propuesta final al
            cliente. Esos comentarios quedan en la base de conocimiento.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <ClientKickoffAssistant
            resumeProjectId={resumeId}
            onCancel={clients.length ? () => setCreating(false) : undefined}
            onStarted={(projectId) => {
              setProjectId(projectId);
              router.push("/gantt");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Cartera</p>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-slate-600">
            Cada cliente tiene sus proyectos. El kickoff interno pide la propuesta inicial, el
            comentario de cada área y el cierre del gestor. Los registros alimentan la{" "}
            <Link href="/knowledge" className="underline">
              base de conocimiento
            </Link>
            .
          </p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => {
              setResumeId(undefined);
              setCreating(true);
            }}
            className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
          >
            Nuevo cliente o proyecto
          </button>
        ) : null}
      </div>

      <ul className="space-y-3">
        {clients.map((client) => {
          const works = projects.filter((item) => item.clientId === client.id);
          return (
            <li key={client.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold">{clientLabel(client)}</h2>
              {client.contactName ? (
                <p className="text-xs text-slate-500">
                  Contacto: {client.contactName}
                  {client.contactEmail ? ` · ${client.contactEmail}` : ""}
                </p>
              ) : null}
              {works.length ? (
                <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {works.map((project) => (
                    <li
                      key={project.id}
                      className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {project.name}{" "}
                          <span className="font-normal text-slate-500">({project.code})</span>
                        </p>
                        <p className="text-xs text-slate-500">{KICKOFF_PHASE_LABEL[project.kickoffPhase]}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.kickoffPhase !== "client_done" ? (
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                            onClick={() => {
                              setResumeId(project.id);
                              setCreating(true);
                            }}
                          >
                            Continuar kickoff
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                            onClick={() => router.push("/knowledge")}
                          >
                            Ver base de conocimiento
                          </button>
                        )}
                        <button
                          type="button"
                          className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs text-white"
                          onClick={() => {
                            setProjectId(project.id);
                            router.push(project.kickoffPhase === "client_done" ? "/gantt" : "/clients");
                          }}
                        >
                          {project.kickoffPhase === "client_done" ? "Calendario" : "Abrir"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Aún no hay proyectos en este cliente.</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
