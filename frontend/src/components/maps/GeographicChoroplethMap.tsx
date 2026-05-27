import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeoDrillLevel } from "./geoTypes";
import type { MapRegion } from "./mapTypes";
import {
  DISTRICT_CHOROPLETH,
  districtStateFillColor,
} from "./choroplethColors";
import { TN_DISTRICTS_GEOJSON_URL } from "../../constants/maps/mapAssets";
import { MapDrillHeader } from "./GeographicMapBreadcrumbs";

interface DistrictProperties {
  code: string;
  name: string;
  osm_id?: number | null;
}

type DistrictFeature = Feature<Geometry, DistrictProperties>;
type DistrictFeatureCollection = FeatureCollection<
  Geometry,
  DistrictProperties
>;

export interface GeographicChoroplethMapProps {
  title: string;
  regions: MapRegion[];
  level: GeoDrillLevel;
  districtCode?: string;
  districtName?: string;
  hoveredCode: string | null;
  onHover: (code: string | null) => void;
  /** Fires when a district polygon is clicked on the map. Always navigates by district. */
  onSelectDistrict: (code: string) => void;
  onNavigate: (updates: Record<string, string | null>) => void;
  disableEmpty?: boolean;
}

const VIEW_W = 800;
const VIEW_H = 760;

let cachedGeo: DistrictFeatureCollection | null = null;
let cachedPromise: Promise<DistrictFeatureCollection> | null = null;

async function loadDistricts(): Promise<DistrictFeatureCollection> {
  if (cachedGeo) return cachedGeo;
  if (cachedPromise) return cachedPromise;
  cachedPromise = fetch(TN_DISTRICTS_GEOJSON_URL)
    .then((r) => {
      if (!r.ok)
        throw new Error(
          `Failed to load district boundaries (HTTP ${r.status})`,
        );
      return r.json() as Promise<DistrictFeatureCollection>;
    })
    .then((data) => {
      cachedGeo = data;
      return data;
    })
    .catch((err) => {
      cachedPromise = null;
      throw err;
    });
  return cachedPromise;
}

function shouldShowLabel(area: number): boolean {
  return area > 1200;
}

interface DistrictLayout {
  feature: DistrictFeature;
  code: string;
  name: string;
  d: string;
  cx: number;
  cy: number;
  area: number;
}

export function GeographicChoroplethMap({
  title,
  regions,
  level,
  districtCode = "",
  districtName = "",
  hoveredCode,
  onHover,
  onSelectDistrict,
  onNavigate,
  disableEmpty = false,
}: GeographicChoroplethMapProps) {
  const [geo, setGeo] = useState<DistrictFeatureCollection | null>(cachedGeo);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (geo) return;
    let cancelled = false;
    loadDistricts()
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
  }, [geo]);

  const layouts = useMemo<DistrictLayout[]>(() => {
    if (!geo) return [];
    const projection = geoMercator().fitSize(
      [VIEW_W, VIEW_H],
      geo as GeoPermissibleObjects,
    );
    const path = geoPath(projection);

    const out: DistrictLayout[] = [];
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
  const max = useMemo(
    () => Math.max(0, ...regions.map((r) => r.count)),
    [regions],
  );

  const hoveredRegion = hoveredCode ? regionByCode.get(hoveredCode) : null;

  return (
    <div className="relative">
      <MapDrillHeader
        level={level}
        district={districtCode || undefined}
        districtName={districtName}
        onNavigate={onNavigate}
        subtitle={title}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-3 mb-2">
          {error}
        </div>
      )}

      {!geo && !error && (
        <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg h-[480px]">
          <p className="text-xs text-slate-400">
            Loading Tamil Nadu boundaries…
          </p>
        </div>
      )}

      {geo && (
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto max-h-[640px] bg-[#eef6fb] rounded-lg border border-slate-200"
          role="img"
          aria-label={title}
        >
          {layouts.map((d) => {
            const region = regionByCode.get(d.code);
            const count = region?.count ?? 0;
            const isFocusedDistrict =
              level !== "state" && districtCode === d.code;
            const isHovered = hoveredCode === d.code;

            const fill =
              level !== "state"
                ? DISTRICT_CHOROPLETH.none
                : districtStateFillColor({
                    count,
                    max,
                    disableEmpty,
                    isFocused: isFocusedDistrict,
                  });

            const stroke = isHovered ? "#0f172a" : "#ffffff";
            const strokeWidth = isHovered || isFocusedDistrict ? 2.5 : 1.2;

            return (
              <path
                key={d.code}
                d={d.d}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                style={{
                  cursor: "pointer",
                  transition: "fill 120ms ease, stroke 120ms ease",
                }}
                onMouseEnter={() => onHover(d.code)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSelectDistrict(d.code)}
              >
                <title>
                  {d.name}
                  {region ? ` — ${region.count.toLocaleString()} MSMEs` : ""}
                </title>
              </path>
            );
          })}

          {layouts.map((d) => {
            const isFocused = level !== "state" && districtCode === d.code;
            const isHovered = hoveredCode === d.code;
            const visible = shouldShowLabel(d.area) || isFocused || isHovered;
            if (!visible) return null;
            const fontSize = isFocused || isHovered ? 14 : 11;

            return (
              <text
                key={`label-${d.code}`}
                x={d.cx}
                y={d.cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fontWeight={isFocused || isHovered ? 700 : 600}
                paintOrder="stroke"
                stroke="#ffffff"
                strokeWidth={3}
                strokeLinejoin="round"
                fill="#0b1220"
                pointerEvents="none"
              >
                {d.name}
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
        <div className="absolute top-10 right-3 bg-surface-card/95 border border-hairline shadow-md rounded-lg px-3 py-2 text-sm pointer-events-none z-10">
          <p className="font-semibold text-slate-900">{hoveredRegion.name}</p>
          <p className="text-slate-600 tabular-nums">
            <strong>{hoveredRegion.count.toLocaleString()}</strong> MSMEs
          </p>
        </div>
      )}

      {level !== "state" && districtName && !hoveredRegion && (
        <div className="absolute top-10 right-3 bg-surface-card/95 border border-hairline shadow-md rounded-lg px-3 py-2 text-sm pointer-events-none z-10">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            {level === "district" ? "District" : "Taluk in"}
          </p>
          <p className="font-semibold text-slate-900">{districtName}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded"
            style={{ background: DISTRICT_CHOROPLETH.high }}
          />{" "}
          High
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded"
            style={{ background: DISTRICT_CHOROPLETH.medium }}
          />{" "}
          Medium
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded"
            style={{ background: DISTRICT_CHOROPLETH.low }}
          />{" "}
          Low
        </span>
        <span className="text-slate-400">
          · Boundaries © OpenStreetMap contributors
        </span>
      </div>
    </div>
  );
}
