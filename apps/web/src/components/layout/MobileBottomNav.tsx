"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Building2,
  Camera,
  CircleDollarSign,
  FolderKanban,
  GanttChart,
  IdCard,
  ImageIcon,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";
import { useOrg } from "@/components/layout/OrgProvider";

const ICONS: Record<string, typeof LayoutDashboard> = {
  "/demo": Home,
  "/knowledge": BookOpen,
  "/admin": Building2,
  "/users": Users,
  "/profiles": IdCard,
  "/teams": Users,
  "/projects": FolderKanban,
  "/clients": Building2,
  "/gantt": GanttChart,
  "/progress": Camera,
  "/costs": Wallet,
  "/budget": CircleDollarSign,
  "/budget-review": CircleDollarSign,
  "/budget-approval": CircleDollarSign,
  "/evidence": ImageIcon,
  "/cuts": LayoutDashboard,
  "/tenant": Building2,
  "/areas": Building2,
  "/finance": CircleDollarSign,
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const { nav } = useOrg();
  const items = [...nav]
    .filter((item) => item.mobile != null)
    .sort((a, b) => (a.mobile ?? 99) - (b.mobile ?? 99))
    .slice(0, 4);

  if (!items.length) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const Icon = ICONS[item.href] ?? LayoutDashboard;
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] leading-tight ${
                  active ? "font-semibold text-[var(--brand)]" : "text-zinc-500"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
