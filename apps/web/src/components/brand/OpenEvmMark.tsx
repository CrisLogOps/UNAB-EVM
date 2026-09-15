export function OpenEvmMark({
  variant = "dark",
  subtitle,
}: {
  variant?: "dark" | "light";
  subtitle?: string;
}) {
  const text = variant === "light" ? "text-white" : "text-zinc-900";
  const sub = variant === "light" ? "text-white/70" : "text-zinc-500";

  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="inline-block h-0 w-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-[var(--accent)]"
      />
      <div>
        <p className={`text-base font-bold leading-none tracking-tight ${text}`}>OpenEVM</p>
        {subtitle ? <p className={`mt-1 text-[11px] leading-none ${sub}`}>{subtitle}</p> : null}
      </div>
    </div>
  );
}
