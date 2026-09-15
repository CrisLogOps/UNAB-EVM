"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ROLE_LABELS } from "@/lib/constants";
import type { AtomicPermission, UserRole } from "@/lib/types";
import { useOrg } from "@/components/layout/OrgProvider";
import { useRoleContext } from "@/components/layout/RoleProvider";
import { ReadOnlyBanner } from "@/components/auth/ReadOnlyBanner";
import { HOME_HREF } from "@/lib/startup-flow";

export function RoleGate({
  allow,
  children,
  permission,
}: {
  allow: UserRole[];
  children: ReactNode;
  permission?: AtomicPermission;
}) {
  const pathname = usePathname();
  const { role } = useRoleContext();
  const { canOperate, responsibleFor, nav } = useOrg();
  const coveredHere = Boolean(
    permission &&
      canOperate(permission) &&
      nav.some((item) => item.href === pathname),
  );

  if (allow.includes(role) || (role !== "owner" && coveredHere)) return children;

  if (role === "owner") {
    const readOnly = permission ? !canOperate(permission) : false;
    return (
      <>
        {readOnly ? <ReadOnlyBanner responsible={permission ? responsibleFor(permission) : undefined} /> : null}
        {children}
      </>
    );
  }

  const puesto = allow.map((item) => ROLE_LABELS[item]).join(" o ");

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <h1 className="text-lg font-semibold text-amber-950">Esta pantalla es de {puesto}</h1>
      <p className="mt-2 text-sm text-amber-900">
        Ahora estás como <strong>{ROLE_LABELS[role]}</strong>. Cambia «Ver como» arriba para entrar con
        el puesto correcto, o vuelve a{" "}
        <Link href={HOME_HREF} className="underline">
          Inicio
        </Link>
        .
      </p>
    </div>
  );
}
