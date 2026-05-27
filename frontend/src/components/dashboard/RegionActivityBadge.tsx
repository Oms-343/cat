import type { RegionActivityTier } from "../maps/choroplethColors";
import { cn } from "../../utils/cn";

const tierStyles: Record<RegionActivityTier, string> = {
  high: "bg-red-50 text-red-800 border-red-200",
  medium: "bg-emerald-50 text-emerald-800 border-emerald-200",
  low: "bg-amber-50 text-amber-900 border-amber-200",
  none: "bg-pink-50 text-pink-800 border-pink-200",
  inactive: "bg-surface-soft text-muted border-hairline",
};

interface RegionActivityBadgeProps {
  label: string;
  tier: RegionActivityTier;
  className?: string;
}

/** Pill label matching the map legend (High / Medium / Low / …). */
export function RegionActivityBadge({
  label,
  tier,
  className,
}: RegionActivityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[4.75rem] px-2 py-0.5 rounded-full text-[10px] font-semibold border tabular-nums",
        tierStyles[tier],
        className,
      )}
    >
      {label}
    </span>
  );
}
