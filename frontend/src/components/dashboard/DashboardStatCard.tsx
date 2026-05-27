import type { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Secondary insight line under the value. */
  detail?: string;
}

export function DashboardStatCard({
  label,
  value,
  icon: Icon,
  detail,
}: DashboardStatCardProps) {
  return (
    <div className="bg-canvas border border-hairline rounded-xl px-4 py-3.5 shadow-sm flex items-center gap-3 min-w-0">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {label}
        </p>
        <p className="text-2xl font-bold text-ink tabular-nums leading-none mt-1">
          {value}
        </p>
        {detail && (
          <p className="text-xs text-muted mt-1.5 leading-snug line-clamp-2">
            {detail}
          </p>
        )}
      </div>
      <div
        className="shrink-0 w-9 h-9 rounded-lg bg-brand-accent/10 text-brand-accent flex items-center justify-center"
        aria-hidden
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
      </div>
    </div>
  );
}
