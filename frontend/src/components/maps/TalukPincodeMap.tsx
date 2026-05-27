import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { talukGeoJsonUrl } from "../../constants/maps/mapAssets";
import type { MapRegion } from "./mapTypes";
import {
  getTalukPlaceholder,
  loadTalukPlaceholders,
  type TalukPlaceholderMap,
} from "./talukPlaceholders";
import {
  fillColorByCount,
  findLayoutTaluk,
  getLayoutDistrictKey,
  loadLayoutData,
  loadTalukIndex,
  pincodeRadius,
  type LayoutData,
  type LayoutPincode,
  type TalukIndex,
} from "./tnLayoutMap";
import {
  formatTalukMapSubtitle,
  MapDrillHeader,
} from "./GeographicMapBreadcrumbs";
import type { GeoDrillLevel } from "./geoTypes";

interface TalukProperties {
  code: string;
  name: string;
}

const VIEW_W = 800;
const VIEW_H = 760;

const geoCache = new Map<
  string,
  FeatureCollection<Geometry, TalukProperties>
>();

export interface TalukPincodeMapProps {
  level: Extract<GeoDrillLevel, "taluk">;
  district?: string;
  districtCode: string;
  districtName: string;
  taluk?: string;
  talukCode: string;
  talukName: string;
  regions: MapRegion[];
  hoveredCode: string | null;
  onHover: (code: string | null) => void;
  onSelectPincode: (pincode: string) => void;
  onNavigate: (updates: Record<string, string | null>) => void;
  onBack: () => void;
}

interface PincodeMarker {
  pincode: string;
  /** Area label when distinct from pincode; empty otherwise */
  name: string;
  count: number;
  x: number;
  y: number;
}

function pincodeSubtitle(
  pincode: string,
  apiName: string,
  layoutName?: string,
): string {
  for (const candidate of [apiName, layoutName ?? ""]) {
    if (candidate && candidate !== pincode) return candidate;
  }
  return "";
}

function distributeMarkers(
  regions: MapRegion[],
  cx: number,
  cy: number,
): PincodeMarker[] {
  if (regions.length === 0) return [];
  if (regions.length === 1) {
    return [
      {
        pincode: regions[0].code,
        name: pincodeSubtitle(regions[0].code, regions[0].name),
        count: regions[0].count,
        x: cx,
        y: cy,
      },
    ];
  }
  const radius = Math.min(80, 20 + regions.length * 8);
  return regions.map((r, i) => {
    const angle = (2 * Math.PI * i) / regions.length - Math.PI / 2;
    return {
      pincode: r.code,
      name: pincodeSubtitle(r.code, r.name),
      count: r.count,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
}

function layoutToMarkers(
  layoutPins: LayoutPincode[],
  regions: MapRegion[],
  viewW: number,
  viewH: number,
): PincodeMarker[] {
  const scaleX = viewW / 500;
  const scaleY = viewH / 520;
  const byPin = new Map(regions.map((r) => [r.code, r]));
  return layoutPins
    .filter((p) => byPin.has(p.p))
    .map((p) => {
      const api = byPin.get(p.p)!;
      return {
        pincode: p.p,
        name: pincodeSubtitle(p.p, api.name, p.n),
        count: api.count,
        x: p.x * scaleX,
        y: p.y * scaleY,
      };
    });
}

function placeholderToMarkers(
  layoutPins: LayoutPincode[],
  regions: MapRegion[],
): PincodeMarker[] {
  const byPin = new Map(regions.map((r) => [r.code, r]));
  return layoutPins
    .filter((p) => byPin.has(p.p))
    .map((p) => {
      const api = byPin.get(p.p)!;
      return {
        pincode: p.p,
        name: pincodeSubtitle(p.p, api.name, p.n),
        count: api.count,
        x: p.x,
        y: p.y,
      };
    });
}

async function loadDistrictTaluks(districtCode: string) {
  const cached = geoCache.get(districtCode);
  if (cached) return cached;
  const data = (await fetch(talukGeoJsonUrl(districtCode)).then(
    (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
  )) as FeatureCollection<Geometry, TalukProperties>;
  geoCache.set(districtCode, data);
  return data;
}

export function TalukPincodeMap({
  level,
  district,
  districtCode,
  districtName,
  taluk,
  talukCode,
  talukName,
  regions,
  hoveredCode,
  onHover,
  onSelectPincode,
  onNavigate,
  onBack,
}: TalukPincodeMapProps) {
  const [geo, setGeo] = useState<FeatureCollection<
    Geometry,
    TalukProperties
  > | null>(null);
  const [layout, setLayout] = useState<LayoutData | null>(null);
  const [index, setIndex] = useState<TalukIndex | null>(null);
  const [placeholders, setPlaceholders] = useState<TalukPlaceholderMap | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadDistrictTaluks(districtCode),
      loadLayoutData().catch(() => null),
      loadTalukIndex().catch(() => null),
      loadTalukPlaceholders().catch(() => null),
    ])
      .then(([geoData, layoutData, indexData, placeholderData]) => {
        if (cancelled) return;
        setGeo(geoData);
        setLayout(layoutData);
        setIndex(indexData);
        setPlaceholders(placeholderData);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [districtCode]);

  const placeholder = useMemo(
    () => getTalukPlaceholder(placeholders, talukCode),
    [placeholders, talukCode],
  );

  const { pathD, cx, cy, talukLabel, isPlaceholder, boundaryFill } = useMemo(() => {
    if (geo) {
      const feature = geo.features.find((f) => f.properties.code === talukCode);
      if (feature) {
        const fc = { type: "FeatureCollection" as const, features: [feature] };
        const projection = geoMercator().fitSize(
          [VIEW_W, VIEW_H],
          fc as GeoPermissibleObjects,
        );
        const path = geoPath(projection);
        const d = path(feature as GeoPermissibleObjects) ?? "";
        const [px, py] = path.centroid(feature as GeoPermissibleObjects);
        return {
          pathD: d,
          cx: px,
          cy: py,
          talukLabel: feature.properties.name,
          isPlaceholder: false,
          boundaryFill: "#dc2626",
        };
      }
    }

    if (placeholder) {
      return {
        pathD: placeholder.d,
        cx: placeholder.cx,
        cy: placeholder.cy,
        talukLabel: placeholder.name || talukName,
        isPlaceholder: true,
        boundaryFill: placeholder.fill,
      };
    }

    return {
      pathD: "",
      cx: VIEW_W / 2,
      cy: VIEW_H / 2,
      talukLabel: talukName,
      isPlaceholder: false,
      boundaryFill: "#dc2626",
    };
  }, [geo, talukCode, talukName, placeholder]);

  const markers = useMemo(() => {
    if (regions.length === 0) return [];

    if (placeholder?.pincodes?.length) {
      const fromPlaceholder = placeholderToMarkers(placeholder.pincodes, regions);
      if (fromPlaceholder.length > 0) return fromPlaceholder;
    }

    const layoutKey = getLayoutDistrictKey(districtCode);
    if (layout && index && layoutKey) {
      const layoutTaluk = findLayoutTaluk(
        layout.districts[layoutKey] ?? [],
        talukCode,
        index,
        districtCode,
      );
      if (layoutTaluk?.pincodes?.length) {
        const fromLayout = layoutToMarkers(
          layoutTaluk.pincodes,
          regions,
          VIEW_W,
          VIEW_H,
        );
        if (fromLayout.length > 0) return fromLayout;
      }
    }
    return distributeMarkers(regions, cx, cy);
  }, [
    layout,
    index,
    districtCode,
    talukCode,
    regions,
    cx,
    cy,
    placeholder,
  ]);

  const totalCount = regions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="relative">
      <MapDrillHeader
        level={level}
        district={district ?? districtCode}
        districtName={districtName}
        taluk={taluk ?? talukCode}
        talukName={talukName || talukLabel}
        onNavigate={onNavigate}
        subtitle={formatTalukMapSubtitle(
          districtName,
          markers.length,
          totalCount,
        )}
        levelPill="Taluk"
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

      {geo && !pathD && !placeholder && (
        <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg h-[480px]">
          <p className="text-xs text-slate-400">
            Taluk boundary unavailable for this selection.
          </p>
        </div>
      )}

      {pathD && (
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto max-h-[640px] bg-[#eef6fb] rounded-lg border border-slate-200"
          role="img"
          aria-label={`${talukLabel} pincode map`}
        >
          <path
            d={pathD}
            fill={boundaryFill}
            fillOpacity={0.35}
            stroke="#0b1220"
            strokeWidth={1.2}
            strokeDasharray={isPlaceholder ? "8 6" : undefined}
            pointerEvents="none"
          />

          {isPlaceholder && (
            <text
              x={VIEW_W / 2}
              y={56}
              fontSize={12}
              fontWeight={600}
              fill="#64748b"
              textAnchor="middle"
              pointerEvents="none"
            >
              Approximate area — official boundary unavailable
            </text>
          )}

          {markers.map((p) => {
            const r = pincodeRadius(p.count);
            const isHovered = hoveredCode === p.pincode;
            const fill = isHovered ? "#22c55e" : fillColorByCount(p.count);

            return (
              <g key={p.pincode}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={fill}
                  fillOpacity={0.85}
                  stroke="#ffffff"
                  strokeWidth={2}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => onHover(p.pincode)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onSelectPincode(p.pincode)}
                >
                  <title>
                    {p.pincode}
                    {p.name ? ` — ${p.name}` : ""} — {p.count.toLocaleString()}{" "}
                    MSMEs
                  </title>
                </circle>
                <text
                  x={p.x}
                  y={p.y + r + 11}
                  fontSize={9.5}
                  fontWeight={700}
                  fill="#0b1220"
                  textAnchor="middle"
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  pointerEvents="none"
                >
                  {p.pincode}
                </text>
                {p.name ? (
                  <text
                    x={p.x}
                    y={p.y + r + 22}
                    fontSize={8.5}
                    fontWeight={500}
                    fill="#475569"
                    textAnchor="middle"
                    paintOrder="stroke"
                    stroke="#ffffff"
                    strokeWidth={2}
                    pointerEvents="none"
                  >
                    {p.name.length > 18 ? `${p.name.slice(0, 17)}…` : p.name}
                  </text>
                ) : null}
              </g>
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

      <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-slate-500">
        {isPlaceholder ? (
          <span className="text-slate-400">
            · Placeholder layout — pincode locations shown; official taluk boundary not available
          </span>
        ) : (
          <span className="text-slate-400">
            · Boundaries © LGD / Bharatmaps (Govt. of India)
          </span>
        )}
      </div>
    </div>
  );
}
