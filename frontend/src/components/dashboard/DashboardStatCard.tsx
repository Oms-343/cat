import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface DashboardStatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  /** Large secondary metric (e.g. percentage). */
  secondaryValue?: string;
  /** Insight line between metrics and footer. */
  detail?: ReactNode;
  /** Muted caption at the bottom of the card. */
  footer?: string;
  className?: string;
}

export function DashboardStatCard({
  label,
  value,
  icon,
  secondaryValue,
  detail,
  footer,
  className,
}: DashboardStatCardProps) {
  return (
    <div
      className={cn(
        "bg-canvas border border-hairline rounded-xl shadow-sm p-3 sm:p-3.5 flex flex-col min-h-[112px] min-w-0",
        className,
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink">
        {label}
      </p>

      <div className="flex items-start justify-between gap-2 mt-2 flex-1">
        <div className="min-w-0">
          <p className="text-2xl font-bold text-ink tabular-nums leading-none">
            {value}
          </p>
          {secondaryValue && (
            <p className="text-xl font-bold text-ink tabular-nums leading-none mt-1">
              {secondaryValue}
            </p>
          )}
          {detail && (
            <div className="text-xs text-muted mt-1.5 leading-snug">{detail}</div>
          )}
        </div>
        <div className="shrink-0 text-brand-accent pt-0.5" aria-hidden>
          {icon}
        </div>
      </div>

      {footer && (
        <p className="text-[11px] text-muted mt-2.5 pt-2 border-t border-hairline leading-snug">
          {footer}
        </p>
      )}
    </div>
  );
}

/** Decorative bar chart matching the geographic dashboard mockup. */
export function MsmeCountChartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("w-8 h-8", className)}
      aria-hidden
    >
      <rect x="4" y="22" width="6" height="14" rx="1" fill="#93c5fd" />
      <rect x="13" y="16" width="6" height="20" rx="1" fill="#60a5fa" />
      <rect x="22" y="10" width="6" height="26" rx="1" fill="#3b82f6" />
      <rect x="31" y="4" width="6" height="32" rx="1" fill="#2563eb" />
    </svg>
  );
}
