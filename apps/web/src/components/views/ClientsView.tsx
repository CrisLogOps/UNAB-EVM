"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientKickoffAssistant } from "@/components/onboarding/ClientKickoffAssistant";
import { useOrg } from "@/components/layout/OrgProvider";
import { KICKOFF_PHASE_LABEL, clientLabel } from "@/lib/kickoff";

export function ClientsView() {
  const { clients, projects, setProjectId, canOperate, role, discardIncompleteClient } = useOrg();
  const router = useRouter();
  const [creating, setCreating] = useState(!clients.length);
  const [resumeId, setResumeId] = useState<string | undefined>();
  const [resumeClientId, setResumeClientId] = useState<string | undefined>();
  const canEdit = canOperate("project:manager") || role === "owner";

  if (creating) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Después de armar la empresa</p>
          <h1 className="text-2xl font-semibold">Clientes y kickoff</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Primero el cliente y el proyecto. Después se cargan los antecedentes, se formaliza el kickoff
            interno y los acuerdos con el cliente cierran la fase 1.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <ClientKickoffAssistant
            resumeProjectId={resumeId}
            resumeClientId={resumeClientId}
            onCancel={
              clients.length
                ? () => {
                    setResumeId(undefined);
                    setResumeClientId(undefined);
                    setCreating(false);
                  }
                : undefined
            }
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
            Cada cliente tiene sus proyectos. Los antecedentes y el kickoff interno dejan el documento, el
            cronograma y la firma antes de cerrar la fase 1 con el cliente. Los registros alimentan la{" "}
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
              setResumeClientId(undefined);
              setCreating(true);
            }}
            className="min-h-11 w-full rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)] sm:w-auto"
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
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-semibold">{clientLabel(client)}</h2>
                <Link
                  href={`/cliente?id=${client.id}`}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                >
                  Vista del cliente
                </Link>
              </div>
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
                        <button
                          type="button"
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                          onClick={() => {
                            setResumeClientId(undefined);
                            setResumeId(project.id);
                            setCreating(true);
                          }}
                        >
                          {project.kickoffPhase === "client_done" ? "Editar proyecto" : "Continuar / editar proyecto"}
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs text-white"
                          onClick={() => {
                            setProjectId(project.id);
                            router.push("/gantt");
                          }}
                        >
                          Cronograma
                        </button>
                        <Link
                          href={`/cliente?id=${client.id}&obra=${project.id}`}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                          onClick={() => setProjectId(project.id)}
                        >
                          Ver como este cliente
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="w-full text-sm text-slate-500">Falta el proyecto de este cliente.</p>
                  {canEdit ? (
                    <button
                      type="button"
                      className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs text-white"
                      onClick={() => {
                        setResumeId(undefined);
                        setResumeClientId(client.id);
                        setCreating(true);
                      }}
                    >
                      Continuar registro
                    </button>
                  ) : null}
                  {canEdit ? (
                    <button
                      type="button"
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                      onClick={() => discardIncompleteClient(client.id)}
                    >
                      Descartar
                    </button>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
