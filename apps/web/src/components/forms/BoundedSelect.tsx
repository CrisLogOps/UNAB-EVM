"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function BoundedSelect({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  "aria-label"?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = options.find((item) => item.value === value)?.label || "Seleccionar";

  function place() {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gutter = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(Math.max(rect.width, 200), vw - gutter * 2);
    let left = rect.left;
    if (left + width > vw - gutter) left = vw - gutter - width;
    if (left < gutter) left = gutter;
    const below = vh - rect.bottom - gutter;
    const above = rect.top - gutter;
    const openDown = below >= 140 || below >= above;
    const maxHeight = Math.max(96, Math.min(280, openDown ? below : above));
    const top = openDown ? rect.bottom + 4 : Math.max(gutter, rect.top - 4 - maxHeight);
    setBox({ top, left, width, maxHeight });
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onReposition = () => place();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-2 py-2 text-left text-sm disabled:opacity-60"
      >
        <span className="min-w-0 flex-1 truncate">{selected}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {mounted && open
        ? createPortal(
            <ul
              ref={listRef}
              role="listbox"
              aria-label={ariaLabel}
              className="fixed z-[80] overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
              style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }}
            >
              {options.map((item) => {
                const active = item.value === value;
                return (
                  <li key={item.value || "empty"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`w-full px-3 py-2.5 text-left text-sm break-words ${
                        active ? "bg-sky-50 font-medium text-sky-950" : "text-zinc-800 hover:bg-zinc-50"
                      }`}
                      onClick={() => {
                        onChange(item.value);
                        setOpen(false);
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </>
  );
}
