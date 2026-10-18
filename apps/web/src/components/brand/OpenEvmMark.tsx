export function OpenEvmMark({
  variant = "dark",
  subtitle,
  compact = false,
}: {
  variant?: "dark" | "light";
  subtitle?: string;
  compact?: boolean;
}) {
  const text = variant === "light" ? "text-white" : "text-zinc-900";
  const sub = variant === "light" ? "text-white/70" : "text-zinc-500";

  return (
    <div className={`flex min-w-0 items-center ${compact ? "gap-1.5" : "gap-2.5"}`}>
      <span
        aria-hidden
        className="inline-block h-0 w-0 shrink-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-[var(--accent)]"
      />
      <div className="min-w-0">
        <p className={`font-bold leading-none tracking-tight ${compact ? "text-sm" : "text-base"} ${text}`}>
          OpenEVM
        </p>
        {subtitle ? <p className={`mt-1 text-[11px] leading-none ${sub}`}>{subtitle}</p> : null}
      </div>
    </div>
  );
}
