"use client";

import { useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { ModalForm } from "@/components/forms/ModalForm";
import { HandoverConfirm } from "@/components/auth/HandoverConfirm";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { isFirstOfRole } from "@/lib/handover";
import type { TenantUser, UserRole } from "@/lib/types";

export function UsersAdminView() {
  const { users, areas, profiles, assignments, addUser, assignProfile, unassignProfile } = useOrg();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<TenantUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    kind: "add" | "assign";
    name: string;
    email?: string;
    userId?: string;
    profileId: string;
    role: UserRole;
  } | null>(null);
  const [handoverOk, setHandoverOk] = useState(false);
  const assignableProfiles = profiles.filter((item) => item.role !== "owner");

  function applyAdd(name: string, email: string, profileId: string) {
    addUser({ name, email, profileId });
    const profile = profiles.find((item) => item.id === profileId);
    setNotice(`${name} entra como ${profile?.name ?? ROLE_LABELS[profile?.role ?? "viewer"]}.`);
    setOpen(false);
  }

  function applyAssign(userId: string, name: string, profileId: string) {
    const ok = assignProfile(userId, profileId);
    const profile = profiles.find((item) => item.id === profileId);
    setNotice(
      ok
        ? `${name} ahora opera con el puesto «${profile?.name ?? profileId}».`
        : "No se pudo asignar ese puesto.",
    );
    setTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Quién entra a la plataforma</p>
          <h1 className="text-2xl font-semibold">Personas</h1>
          <p className="text-sm text-slate-600">
            Invita con nombre y puesto. Al entregar un puesto por primera vez, dejas de editar esa
            parte y solo la miras.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
        >
          Agregar persona
        </button>
      </div>

      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
        Suma solo a colaboradores que ya conozcas. El correo debe ser corporativo.
      </p>

      {notice ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {notice}
        </p>
      ) : null}

      {pending ? (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-white p-4">
          <HandoverConfirm
            role={pending.role}
            personName={pending.name}
            checked={handoverOk}
            onChecked={setHandoverOk}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              onClick={() => {
                setPending(null);
                setHandoverOk(false);
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!handoverOk}
              className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white disabled:opacity-40"
              onClick={() => {
                if (pending.kind === "add" && pending.email) {
                  applyAdd(pending.name, pending.email, pending.profileId);
                }
                if (pending.kind === "assign" && pending.userId) {
                  applyAssign(pending.userId, pending.name, pending.profileId);
                }
                setPending(null);
                setHandoverOk(false);
              }}
            >
              Confirmar y recortar mis permisos
            </button>
          </div>
        </div>
      ) : null}

      <DataTable
        columns={[
          { key: "name", header: "Nombre", accessor: "name" },
          { key: "email", header: "Correo", accessor: "email" },
          {
            key: "profile",
            header: "Puesto",
            render: (row) =>
              profiles.find((item) => item.id === row.profileId)?.name ??
              (row.profileId ? ROLE_LABELS[row.role] : "Sin puesto"),
          },
          {
            key: "area",
            header: "Área",
            render: (row) => areas.find((area) => area.id === row.areaId)?.name ?? "—",
          },
          {
            key: "works",
            header: "Obras",
            render: (row) =>
              String(assignments.filter((item) => item.userId === row.id).length),
          },
        ]}
        data={users}
        rowKey={(row) => row.id}
        filterPlaceholder="Buscar persona…"
        filterFn={(row, q) =>
          `${row.name} ${row.email} ${ROLE_LABELS[row.role]}`.toLowerCase().includes(q)
        }
        actions={[
          {
            label: "Asignar puesto",
            variant: "edit",
            onClick: (row) => {
              if (row.role === "owner") {
                setNotice("El administrador no cambia de puesto desde aquí.");
                return;
              }
              setTarget(row);
            },
          },
          {
            label: "Quitar puesto",
            variant: "delete",
            onClick: (row) => {
              const ok = unassignProfile(row.id);
              setNotice(
                ok
                  ? `${row.name} quedó sin puesto. Si era el único de ese puesto, recuperas la edición.`
                  : "No se puede quitar el puesto del administrador.",
              );
            },
          },
        ]}
      />

      <ModalForm
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva persona"
        submitLabel="Invitar"
        fields={[
          { name: "name", label: "Nombre", type: "text", required: true, placeholder: "Nombre de colaborador" },
          { name: "email", label: "Correo", type: "text", required: true, placeholder: "colaborador@openevm.cl" },
          {
            name: "profileId",
            label: "Perfil",
            type: "select",
            required: true,
            options: assignableProfiles.map((item) => ({
              value: item.id,
              label: `${item.name} → ${ROLE_LABELS[item.role]}`,
            })),
          },
        ]}
        onSubmit={(values) => {
          const profile = profiles.find((item) => item.id === values.profileId);
          if (!profile) return;
          if (isFirstOfRole(users, profile.role)) {
            setPending({
              kind: "add",
              name: values.name,
              email: values.email,
              profileId: values.profileId,
              role: profile.role,
            });
            setOpen(false);
            setHandoverOk(false);
            return;
          }
          applyAdd(values.name, values.email, values.profileId);
        }}
      />

      <ModalForm
        key={target?.id ?? "assign"}
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={target ? `Asignar puesto a ${target.name}` : "Asignar puesto"}
        submitLabel="Guardar puesto"
        fields={[
          {
            name: "profileId",
            label: "Puesto",
            type: "select",
            required: true,
            defaultValue: target?.profileId || assignableProfiles[0]?.id,
            options: assignableProfiles.map((item) => ({
              value: item.id,
              label: `${item.name} → ${ROLE_LABELS[item.role]}`,
            })),
          },
        ]}
        onSubmit={(values) => {
          if (!target) return;
          const profile = profiles.find((item) => item.id === values.profileId);
          if (!profile) return;
          if (isFirstOfRole(users, profile.role)) {
            setPending({
              kind: "assign",
              name: target.name,
              userId: target.id,
              profileId: values.profileId,
              role: profile.role,
            });
            setTarget(null);
            setHandoverOk(false);
            return;
          }
          applyAssign(target.id, target.name, values.profileId);
        }}
      />
    </div>
  );
}
