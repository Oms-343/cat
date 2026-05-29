import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import type { GeoDrillLevel } from "../maps/geoTypes";
import { regionActivityMeta } from "../maps/choroplethColors";
import { cn } from "../../utils/cn";
import { RegionActivityBadge } from "./RegionActivityBadge";

export interface RegionListItem {
  code: string;
  name: string;
  count: number;
  subtitle?: string;
  dotColor: string;
}

interface RegionsListPanelProps {
  items: RegionListItem[];
  hoveredCode: string | null;
  onHover: (code: string | null) => void;
  onSelect: (item: RegionListItem) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  title?: string;
  nameColumnLabel?: string;
  level: Extract<GeoDrillLevel, "state" | "district" | "taluk">;
  maxRegionCount: number;
}

/** Scrollable region list aligned with map height; sizes to content when short. */
export function RegionsListPanel({
  items,
  hoveredCode,
  onHover,
  onSelect,
  loading = false,
  emptyMessage = "No regions in the list yet — use the map to explore.",
  className,
  title = "District Analytics",
  nameColumnLabel = "District Name",
  level,
  maxRegionCount,
}: RegionsListPanelProps) {
  const [query, setQuery] = useState("");
  const showActivity = level === "state";

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q),
    );
  }, [sorted, query]);

  return (
    <div
      className={cn(
        "flex flex-col w-full self-start bg-canvas border border-hairline rounded-xl shadow-sm overflow-hidden",
        className,
      )}
    >
      <div className="shrink-0 px-4 py-3.5 border-b border-hairline flex items-center gap-3">
        <h2 className="text-sm font-semibold text-ink flex-1 min-w-0">
          {title}
        </h2>
        <div className="relative w-full max-w-44 shrink-0">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none"
            strokeWidth={2}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full h-8 pl-8 pr-2.5 text-xs text-ink bg-surface-soft/60 border border-hairline rounded-lg placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent/40"
            aria-label={`Search ${nameColumnLabel.toLowerCase()}`}
          />
        </div>
      </div>

      {loading ? (
        <div
          className="flex flex-col items-center justify-center gap-2 px-4 py-12 min-h-[12rem]"
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="w-5 h-5 text-muted animate-spin"
            strokeWidth={2}
            aria-hidden
          />
          <p className="text-sm text-muted">Loading…</p>
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted text-center">{emptyMessage}</p>
      ) : filtered.length === 0 ? (
        <p className="px-4 py-8 text-sm text-muted text-center">
          No matches for &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <>
          <div
            className={cn(
              "shrink-0 grid gap-2 px-4 py-2 border-b border-hairline-soft bg-surface-soft/40 text-[10px] font-semibold uppercase tracking-wider text-muted",
              showActivity
                ? "grid-cols-[minmax(0,1fr)_auto_auto]"
                : "grid-cols-[minmax(0,1fr)_auto]",
            )}
          >
            <span>{nameColumnLabel}</span>
            {showActivity && (
              <span className="text-center min-w-[4.75rem]">Activity</span>
            )}
            <span className="text-right min-w-16">MSME Count</span>
          </div>
          <ul
            className={cn(
              "overflow-y-auto overscroll-contain scrollbar-thin",
              "max-h-[min(672px,calc(100dvh-14rem))]",
            )}
          >
            {filtered.map((item) => {
              const isEmpty = item.count === 0;
              const isHovered = hoveredCode === item.code;
              const activity = showActivity
                ? regionActivityMeta(level, item.count, maxRegionCount)
                : null;

              return (
                <li
                  key={item.code}
                  className="border-b border-hairline-soft last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    onMouseEnter={() => onHover(item.code)}
                    onMouseLeave={() => onHover(null)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 grid gap-2 items-center transition-colors",
                      showActivity
                        ? "grid-cols-[minmax(0,1fr)_auto_auto]"
                        : "grid-cols-[minmax(0,1fr)_auto]",
                      isHovered
                        ? "bg-brand-accent/4"
                        : "hover:bg-surface-soft/80",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/5"
                        style={{ backgroundColor: item.dotColor }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm leading-tight truncate",
                            isEmpty ? "text-muted" : "font-medium text-ink",
                          )}
                        >
                          {item.name}
                        </p>
                        {item.subtitle && (
                          <p className="text-[10px] text-muted-soft font-mono leading-none mt-0.5 truncate">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    {activity && (
                      <RegionActivityBadge
                        label={activity.label}
                        tier={activity.tier}
                      />
                    )}
                    <span
                      className={cn(
                        "text-right text-sm font-semibold tabular-nums min-w-16",
                        isEmpty ? "text-muted-soft" : "text-ink",
                      )}
                    >
                      {item.count.toLocaleString()}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
