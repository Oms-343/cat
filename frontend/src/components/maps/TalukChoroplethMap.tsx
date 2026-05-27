import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeoDrillLevel } from "./geoTypes";
import type { MapRegion } from "./mapTypes";
import { talukGeoJsonUrl } from "../../constants/maps/mapAssets";
import { DISTRICT_CHOROPLETH } from "./choroplethColors";
import { fillColorByCount } from "./tnLayoutMap";
import {
  formatTalukMapSubtitle,
  MapDrillHeader,
} from "./GeographicMapBreadcrumbs";

interface TalukProperties {
  code: string;
  name: string;
  district_code?: string;
  lgd_code?: number;
  sdtcode11?: string;
}

type TalukFeature = Feature<Geometry, TalukProperties>;
type TalukFeatureCollection = FeatureCollection<Geometry, TalukProperties>;

export interface TalukChoroplethMapProps {
  level: Extract<GeoDrillLevel, "district" | "taluk">;
  district?: string;
  districtCode: string;
  districtName: string;
  taluk?: string;
  talukName?: string;
  talukCode?: string;
  regions: MapRegion[];
  hoveredCode: string | null;
  onHover: (code: string | null) => void;
  onSelectTaluk: (code: string) => void;
  onSelectPincode?: (pincode: string) => void;
  onNavigate: (updates: Record<string, string | null>) => void;
  onBack: () => void;
}

const VIEW_W = 800;
const VIEW_H = 760;

const COLOR_SELECTED = DISTRICT_CHOROPLETH.selected;

const geoCache = new Map<string, TalukFeatureCollection>();
const geoPromises = new Map<string, Promise<TalukFeatureCollection>>();

async function loadDistrictTaluks(
  districtCode: string,
): Promise<TalukFeatureCollection> {
  const cached = geoCache.get(districtCode);
  if (cached) return cached;

  let promise = geoPromises.get(districtCode);
  if (!promise) {
    promise = fetch(talukGeoJsonUrl(districtCode))
      .then((r) => {
        if (!r.ok)
          throw new Error(`Failed to load taluk boundaries (HTTP ${r.status})`);
        return r.json() as Promise<TalukFeatureCollection>;
      })
      .then((data) => {
        geoCache.set(districtCode, data);
        return data;
      })
      .catch((err) => {
        geoPromises.delete(districtCode);
        throw err;
      });
    geoPromises.set(districtCode, promise);
  }
  return promise;
}

function fillForRegion(args: {
  count: number;
  isSelected: boolean;
}): string {
  const { count, isSelected } = args;
  if (isSelected) return COLOR_SELECTED;
  if (count === 0) return DISTRICT_CHOROPLETH.inactive;
  return fillColorByCount(count);
}

function shouldShowLabel(area: number): boolean {
  return area > 800;
}

interface TalukLayout {
  feature: TalukFeature;
  code: string;
  name: string;
  d: string;
  cx: number;
  cy: number;
  area: number;
}

export function TalukChoroplethMap({
  level,
  district,
  districtCode,
  districtName,
  taluk,
  talukName,
  talukCode = "",
  regions,
  hoveredCode,
  onHover,
  onSelectTaluk,
  onNavigate,
  onBack,
}: TalukChoroplethMapProps) {
  const [geo, setGeo] = useState<TalukFeatureCollection | null>(
    geoCache.get(districtCode) ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loadDistrictTaluks(districtCode)
      .then((data) => {
        if (!cancelled) setGeo(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [districtCode]);

  const layouts = useMemo<TalukLayout[]>(() => {
    if (!geo) return [];
    const projection = geoMercator().fitSize(
      [VIEW_W, VIEW_H],
      geo as GeoPermissibleObjects,
    );
    const path = geoPath(projection);

    const out: TalukLayout[] = [];
    for (const feature of geo.features) {
      const d = path(feature as GeoPermissibleObjects);
      if (!d) continue;
      const [cx, cy] = path.centroid(feature as GeoPermissibleObjects);
      const area = path.area(feature as GeoPermissibleObjects);
      out.push({
        feature,
        code: feature.properties.code,
        name: feature.properties.name,
        d,
        cx,
        cy,
        area,
      });
    }
    return out;
  }, [geo]);

  const regionByCode = useMemo(
    () => new Map(regions.map((r) => [r.code, r])),
    [regions],
  );
  const hoveredRegion = hoveredCode ? regionByCode.get(hoveredCode) : null;
  const levelPill = level === "district" ? "District" : "Taluk";
  const totalMsmeCount = regions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="relative">
      <MapDrillHeader
        level={level}
        district={district ?? districtCode}
        districtName={districtName}
        taluk={taluk ?? (talukCode || undefined)}
        talukName={talukName}
        onNavigate={onNavigate}
        subtitle={
          level === "district"
            ? "Click any taluk to drill into pincodes."
            : formatTalukMapSubtitle(
                districtName,
                regions.length,
                totalMsmeCount,
              )
        }
        levelPill={levelPill}
        onBack={onBack}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-3 mb-2">
          {error}
        </div>
      )}

      {!geo && !error && (
        <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg h-[480px]">
          <p className="text-xs text-slate-400">Loading taluk boundaries…</p>
        </div>
      )}

      {geo && (
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto max-h-[640px] bg-[#eef6fb] rounded-lg border border-slate-200"
          role="img"
          aria-label={`${districtName} taluk map`}
        >
          {layouts.map((t) => {
            if (level === "taluk" && t.code !== talukCode) return null;

            const region = regionByCode.get(t.code);
            const count = region?.count ?? 0;
            const isSelected = level === "taluk" && t.code === talukCode;
            const isHovered = hoveredCode === t.code;

            const fill = fillForRegion({ count, isSelected });

            const stroke = isHovered || isSelected ? "#0f172a" : "#ffffff";
            const strokeWidth = isHovered || isSelected ? 2.5 : 1.2;
            const fillOpacity = level === "taluk" ? 0.35 : 1;

            return (
              <path
                key={t.code}
                d={t.d}
                fill={fill}
                fillOpacity={fillOpacity}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                style={{
                  cursor: "pointer",
                  transition: "fill 120ms ease, stroke 120ms ease",
                }}
                onMouseEnter={() => onHover(t.code)}
                onMouseLeave={() => onHover(null)}
                onClick={() => {
                  if (level === "district") onSelectTaluk(t.code);
                }}
              >
                <title>
                  {t.name}
                  {region ? ` — ${region.count.toLocaleString()} MSMEs` : ""}
                </title>
              </path>
            );
          })}

          {layouts.map((t) => {
            if (level === "taluk" && t.code !== talukCode) return null;

            const isSelected = level === "taluk" && t.code === talukCode;
            const isHovered = hoveredCode === t.code;
            const visible = shouldShowLabel(t.area) || isSelected || isHovered;
            if (!visible) return null;

            const fontSize = isSelected || isHovered ? 12 : 10;

            return (
              <text
                key={`label-${t.code}`}
                x={t.cx}
                y={t.cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight={isSelected || isHovered ? 700 : 600}
                paintOrder="stroke"
                stroke="#ffffff"
                strokeWidth={3}
                strokeLinejoin="round"
                fill="#0b1220"
                pointerEvents="none"
              >
                {t.name}
              </text>
            );
          })}

          <g transform="translate(36, 36)" pointerEvents="none">
            <text
              x={0}
              y={0}
              fontSize={18}
              fontWeight={700}
              fill="#0b1220"
              textAnchor="middle"
            >
              N
            </text>
            <path d="M0,6 L-7,22 L0,17 L7,22 Z" fill="#0b1220" />
          </g>
        </svg>
      )}

      {hoveredRegion && (
        <div className="absolute top-16 right-3 bg-surface-card/95 border border-hairline shadow-md rounded-lg px-3 py-2 text-sm pointer-events-none z-10">
          <p className="font-semibold text-slate-900">{hoveredRegion.name}</p>
          <p className="text-slate-600 tabular-nums">
            <strong>{hoveredRegion.count.toLocaleString()}</strong> MSMEs
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: "#dc2626" }} />{" "}
          High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: "#22c55e" }} />{" "}
          Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ background: "#fde047" }} />{" "}
          Low
        </span>
        <span className="text-slate-400">
          · Boundaries © LGD / Bharatmaps (Govt. of India)
        </span>
      </div>
    </div>
  );
}
