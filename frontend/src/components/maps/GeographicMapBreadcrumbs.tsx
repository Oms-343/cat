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
      className={
        active
          ? variant === "page"
            ? "font-semibold text-slate-900"
            : "font-bold text-slate-900"
          : variant === "page"
            ? "hover:text-blue-700 hover:underline"
            : "text-slate-600 hover:text-blue-700 hover:underline"
      }
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
  const separatorClass = "text-slate-400";

  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-1",
        variant === "page" ? "text-sm text-muted" : "text-sm",
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
            className={
              level === "pincode"
                ? "font-semibold text-slate-900"
                : "text-slate-600"
            }
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
