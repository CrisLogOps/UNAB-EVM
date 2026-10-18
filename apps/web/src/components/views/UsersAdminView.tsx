"use client";

import { useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { ModalForm } from "@/components/forms/ModalForm";
import { HandoverConfirm } from "@/components/auth/HandoverConfirm";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { isFirstOfRole } from "@/lib/handover";
import { PASSWORD_MIN_LENGTH } from "@/lib/identity";
import type { TenantUser, UserRole } from "@/lib/types";

export function UsersAdminView() {
  const {
    users,
    areas,
    profiles,
    assignments,
    addUser,
    removeUser,
    assignProfile,
    unassignProfile,
    hasPasswordLogin,
    setPersonPassword,
  } = useOrg();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<TenantUser | null>(null);
  const [credTarget, setCredTarget] = useState<TenantUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    kind: "add" | "assign";
    name: string;
    email?: string;
    password?: string;
    userId?: string;
    profileId: string;
    role: UserRole;
  } | null>(null);
  const [handoverOk, setHandoverOk] = useState(false);
  const assignableProfiles = profiles.filter((item) => item.role !== "owner");

  function applyAdd(name: string, email: string, profileId: string, password: string) {
    const result = addUser({ name, email, profileId, password });
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    const profile = profiles.find((item) => item.id === profileId);
    setNotice(
      `${name} queda como ${profile?.name ?? ROLE_LABELS[profile?.role ?? "viewer"]}. Puede entrar y salir con ${email.trim().toLowerCase()} y la clave definida (Salir → Iniciar sesión).`,
    );
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
            Cada colaborador se registra con correo y clave, igual que el administrador. Con esas
            credenciales entra y sale de OpenEVM. Al entregar un puesto por primera vez, dejas de
            editar esa parte y solo la miras.
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
        El administrador es quien arma la empresa. El resto (por ejemplo Alejandro) también recibe
        usuario (su correo) y clave al registrarlo aquí. Luego prueba Salir e Iniciar sesión con esas
        credenciales; no hace falta repetir el Setup 0.
      </p>

      {assignableProfiles.length ? null : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Aún no hay puestos para invitar. En Áreas activa un paquete (empresa pequeña o mayor) o espera a
          que se carguen los perfiles del modo colaborativo.
        </p>
      )}

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
                if (pending.kind === "add" && pending.email && pending.password) {
                  applyAdd(pending.name, pending.email, pending.profileId, pending.password);
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
          {
            key: "login",
            header: "Acceso",
            render: (row) =>
              hasPasswordLogin(row.email)
                ? "Correo y clave"
                : row.role === "owner"
                  ? "Clave del alta"
                  : "Sin clave",
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
            label: "Clave de acceso",
            variant: "key",
            onClick: (row) => {
              if (row.role === "owner") {
                setNotice("La clave del administrador se define en el alta o se cambia con Olvidé la clave.");
                return;
              }
              setCredTarget(row);
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
          {
            label: "Quitar de la empresa",
            variant: "delete",
            onClick: (row) => {
              if (row.role === "owner") {
                setNotice("No se puede quitar al administrador.");
                return;
              }
              if (
                !window.confirm(
                  `¿Quitar a ${row.name} de la empresa? Si no queda ningún colaborador, vuelve a estar disponible el modo individual.`,
                )
              ) {
                return;
              }
              const ok = removeUser(row.id);
              setNotice(ok ? `${row.name} ya no está en la empresa.` : "No se pudo quitar a esa persona.");
            },
          },
        ]}
      />

      <ModalForm
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva persona"
        submitLabel="Registrar y dar clave"
        fields={[
          { name: "name", label: "Nombre", type: "text", required: true, placeholder: "Alejandro Contreras" },
          {
            name: "email",
            label: "Correo (usuario de entrada)",
            type: "text",
            required: true,
            placeholder: "alejandro@openevm.cl",
          },
          {
            name: "password",
            label: "Clave de acceso",
            type: "password",
            required: true,
            minLength: PASSWORD_MIN_LENGTH,
            autoComplete: "new-password",
            placeholder: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`,
          },
          {
            name: "passwordConfirm",
            label: "Repite la clave",
            type: "password",
            required: true,
            minLength: PASSWORD_MIN_LENGTH,
            autoComplete: "new-password",
          },
          {
            name: "profileId",
            label: "Perfil",
            type: "select",
            required: true,
            options: [
              { value: "", label: assignableProfiles.length ? "Selecciona un puesto" : "No hay puestos disponibles" },
              ...assignableProfiles.map((item) => ({
                value: item.id,
                label: `${item.name} → ${ROLE_LABELS[item.role]}`,
              })),
            ],
          },
        ]}
        onSubmit={(values) => {
          const profile = profiles.find((item) => item.id === values.profileId);
          if (!profile) return;
          if (values.password !== values.passwordConfirm) {
            setNotice("La clave y su confirmación no coinciden.");
            return;
          }
          if (isFirstOfRole(users, profile.role)) {
            setPending({
              kind: "add",
              name: values.name,
              email: values.email,
              password: values.password,
              profileId: values.profileId,
              role: profile.role,
            });
            setOpen(false);
            setHandoverOk(false);
            return;
          }
          applyAdd(values.name, values.email, values.profileId, values.password);
        }}
      />

      <ModalForm
        key={credTarget?.id ?? "password"}
        open={Boolean(credTarget)}
        onClose={() => setCredTarget(null)}
        title={credTarget ? `Clave de acceso de ${credTarget.name}` : "Clave de acceso"}
        submitLabel={credTarget && hasPasswordLogin(credTarget.email) ? "Cambiar clave" : "Definir clave"}
        fields={[
          {
            name: "password",
            label: "Clave para entrar a OpenEVM",
            type: "password",
            required: true,
            minLength: PASSWORD_MIN_LENGTH,
            autoComplete: "new-password",
            placeholder: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`,
          },
          {
            name: "passwordConfirm",
            label: "Repite la clave",
            type: "password",
            required: true,
            minLength: PASSWORD_MIN_LENGTH,
            autoComplete: "new-password",
          },
        ]}
        onSubmit={(values) => {
          if (!credTarget) return;
          if (values.password !== values.passwordConfirm) {
            setNotice("La clave y su confirmación no coinciden.");
            return;
          }
          const result = setPersonPassword(credTarget.id, values.password);
          setNotice(result.message);
          if (result.ok) setCredTarget(null);
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
