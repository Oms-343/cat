import type { GeoDrillLevel } from "./geoTypes";
import { cn } from "../../utils/cn";

export interface GeographicMapBreadcrumbsProps {
  level: GeoDrillLevel;
  district?: string;
  districtName?: string;
  taluk?: string;
  talukName?: string;
  pincode?: string;
  onNavigate: (updates: Record<string, string | null>) => void;
  className?: string;
  /** Page header uses muted tokens; map panel uses slate for contrast on the card. */
  variant?: "page" | "panel";
}

const panelPillBase =
  "px-1.5 py-px rounded-full border text-xs leading-tight transition-colors";

function panelPillClass(active: boolean) {
  return cn(
    panelPillBase,
    active
      ? "border-slate-300 bg-slate-100 font-semibold text-slate-900"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-blue-700",
  );
}

function Crumb({
  children,
  active,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  variant: "page" | "panel";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        variant === "panel"
          ? cn(panelPillClass(active), "cursor-pointer")
          : active
            ? "font-semibold text-slate-900"
            : "hover:text-blue-700 hover:underline",
      )}
    >
      {children}
    </button>
  );
}

export function GeographicMapBreadcrumbs({
  level,
  district,
  districtName,
  taluk,
  talukName,
  pincode,
  onNavigate,
  className,
  variant = "page",
}: GeographicMapBreadcrumbsProps) {
  const separatorClass = cn(
    "text-slate-400",
    variant === "panel" && "text-[10px] mx-px",
  );

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center",
        "gap-1",
        variant === "page" ? "text-sm text-muted" : "text-xs",
        className,
      )}
      aria-label="Map location"
    >
      <Crumb
        variant={variant}
        active={level === "state"}
        onClick={() =>
          onNavigate({ district: null, taluk: null, pincode: null })
        }
      >
        Tamil Nadu
      </Crumb>
      {district && (
        <>
          <span className={separatorClass}>›</span>
          <Crumb
            variant={variant}
            active={level === "district"}
            onClick={() => onNavigate({ taluk: null, pincode: null })}
          >
            {districtName || district}
          </Crumb>
        </>
      )}
      {taluk && (
        <>
          <span className={separatorClass}>›</span>
          <Crumb
            variant={variant}
            active={level === "taluk"}
            onClick={() => onNavigate({ pincode: null })}
          >
            {talukName || taluk}
          </Crumb>
        </>
      )}
      {pincode && (
        <>
          <span className={separatorClass}>›</span>
          <span
            className={cn(
              variant === "panel"
                ? panelPillClass(level === "pincode")
                : level === "pincode"
                  ? "font-semibold text-slate-900"
                  : "text-slate-600",
            )}
          >
            {pincode}
          </span>
        </>
      )}
    </nav>
  );
}

/** Taluk map subtitle; omits pincode count when there are no MSMEs. */
export function formatTalukMapSubtitle(
  districtName: string,
  pincodeCount: number,
  msmeCount: number,
): string {
  const msmeLabel = `${msmeCount.toLocaleString()} MSMEs`;
  if (msmeCount === 0) {
    return `${districtName} · ${msmeLabel}`;
  }
  return `${districtName} · ${pincodeCount} pincodes · ${msmeLabel}`;
}

export interface MapDrillHeaderProps {
  level: GeoDrillLevel;
  district?: string;
  districtName?: string;
  taluk?: string;
  talukName?: string;
  pincode?: string;
  onNavigate: (updates: Record<string, string | null>) => void;
  subtitle?: string;
  levelPill?: string;
  onBack?: () => void;
}

/** Breadcrumbs + optional subtitle and level back pill for drill-down maps. */
export function MapDrillHeader({
  subtitle,
  levelPill,
  onBack,
  ...breadcrumbProps
}: MapDrillHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="min-w-0 flex-1">
        <GeographicMapBreadcrumbs variant="panel" {...breadcrumbProps} />
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {levelPill && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded border border-hairline bg-surface-card/90 text-body hover:bg-surface-soft"
        >
          {levelPill}
        </button>
      )}
    </div>
  );
}
