import type { GeoDrillLevel } from "./geoTypes";
import { fillColorByCount } from "./tnLayoutMap";

export const DISTRICT_CHOROPLETH = {
  high: "#dc2626",
  medium: "#22c55e",
  low: "#fde047",
  none: "#fbcfe8",
  selected: "#22c55e",
  inactive: "#e5e7eb",
} as const;

/** State-level district fill — must stay in sync with GeographicChoroplethMap. */
export function districtStateFillColor(options: {
  count: number;
  max: number;
  disableEmpty?: boolean;
  isFocused?: boolean;
}): string {
  const { count, max, disableEmpty = true, isFocused = false } = options;

  if (isFocused) return DISTRICT_CHOROPLETH.selected;
  if (count === 0) {
    return disableEmpty
      ? DISTRICT_CHOROPLETH.inactive
      : DISTRICT_CHOROPLETH.none;
  }

  const ratio = max > 0 ? count / max : 0;
  if (ratio > 0.66) return DISTRICT_CHOROPLETH.high;
  if (ratio > 0.33) return DISTRICT_CHOROPLETH.medium;
  return DISTRICT_CHOROPLETH.low;
}

/** Dot color for a row in the Regions list — matches the active map layer. */
export function regionListDotColor(
  level: Extract<GeoDrillLevel, "state" | "district" | "taluk">,
  count: number,
  maxCount: number,
): string {
  if (level === "state") {
    return districtStateFillColor({ count, max: maxCount, disableEmpty: true });
  }
  if (count === 0) {
    return DISTRICT_CHOROPLETH.inactive;
  }
  return fillColorByCount(count);
}

export type RegionActivityTier =
  | "high"
  | "medium"
  | "low"
  | "none"
  | "inactive";

/** Activity label + tier for list badges — aligned with map choropleth tiers. */
export function regionActivityMeta(
  level: Extract<GeoDrillLevel, "state" | "district" | "taluk">,
  count: number,
  maxCount: number,
): { label: string; tier: RegionActivityTier } {
  if (count === 0) {
    if (level === "state") return { label: "Inactive", tier: "inactive" };
    if (level === "district") return { label: "No MSMEs", tier: "none" };
    return { label: "No MSMEs", tier: "inactive" };
  }

  if (level === "state") {
    const ratio = maxCount > 0 ? count / maxCount : 0;
    if (ratio > 0.66) return { label: "High", tier: "high" };
    if (ratio > 0.33) return { label: "Medium", tier: "medium" };
    return { label: "Low", tier: "low" };
  }

  if (count >= 1000) return { label: "High", tier: "high" };
  if (count >= 100) return { label: "Medium", tier: "medium" };
  return { label: "Low", tier: "low" };
}
