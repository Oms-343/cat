import { useEffect, useMemo, useState } from 'react'
import type { GeoDrillLevel } from './geoTypes'
import type { MapRegion } from './mapTypes'
import {
  fillColorByCount,
  findLayoutTaluk,
  getLayoutDistrictKey,
  loadLayoutData,
  loadTalukIndex,
  resolveTalukCode,
  pincodeRadius,
  type LayoutData,
  type LayoutPincode,
  type LayoutTaluk,
  type TalukIndex,
} from './tnLayoutMap'

export interface LayoutDrillMapProps {
  level: Extract<GeoDrillLevel, 'district' | 'taluk'>
  districtCode: string
  districtName: string
  talukCode?: string
  talukName?: string
  regions: MapRegion[]
  hoveredCode: string | null
  onHover: (code: string | null) => void
  onSelectTaluk: (code: string) => void
  onSelectPincode: (pincode: string) => void
  onBack: () => void
}

const COLOR_SELECTED = '#22c55e'

interface MergedPincode extends LayoutPincode {
  count: number
}

function mergePincodeCounts(
  layoutPins: LayoutPincode[],
  regions: MapRegion[],
): MergedPincode[] {
  const byPin = new Map(regions.map((r) => [r.code, r.count]))
  return layoutPins.map((p) => ({
    ...p,
    count: byPin.get(p.p) ?? p.c,
  }))
}

function mergeTalukCounts(
  layoutTaluks: LayoutTaluk[],
  regions: MapRegion[],
  districtCode: string,
  index: TalukIndex,
): Array<LayoutTaluk & { code: string | null; count: number }> {
  const byCode = new Map(regions.map((r) => [r.code, r]))
  return layoutTaluks.map((t) => {
    const code = resolveTalukCode(
      districtCode,
      t.name,
      index,
      regions.map((r) => ({ code: r.code, name: r.name })),
    )
    const api = byCode.get(code)
    return {
      ...t,
      code,
      count: api?.count ?? t.count,
      fill: api ? fillColorByCount(api.count) : t.fill,
    }
  })
}

export function LayoutDrillMap({
  level,
  districtCode,
  districtName,
  talukCode = '',
  talukName = '',
  regions,
  hoveredCode,
  onHover,
  onSelectTaluk,
  onSelectPincode,
  onBack,
}: LayoutDrillMapProps) {
  const [layout, setLayout] = useState<LayoutData | null>(null)
  const [index, setIndex] = useState<TalukIndex | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([loadLayoutData(), loadTalukIndex()])
      .then(([layoutData, indexData]) => {
        if (!cancelled) {
          setLayout(layoutData)
          setIndex(indexData)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const layoutKey = getLayoutDistrictKey(districtCode)
  const viewW = layout?.viewBox.width ?? 500
  const viewH = layout?.viewBox.height ?? 520

  const layoutTaluks = useMemo(() => {
    if (!layout || !layoutKey || !index) return []
    return mergeTalukCounts(layout.districts[layoutKey] ?? [], regions, districtCode, index)
  }, [layout, layoutKey, index, regions, districtCode])

  const activeTaluk = useMemo(() => {
    if (!layout || !layoutKey || !index || !talukCode) return null
    const raw = layout.districts[layoutKey] ?? []
    const found = findLayoutTaluk(raw, talukCode, index, districtCode)
    if (!found) return null
    const merged = layoutTaluks.find((t) => t.name === found.name)
    return merged ?? { ...found, code: talukCode, count: found.count }
  }, [layout, layoutKey, index, talukCode, layoutTaluks])

  const pincodes = useMemo(() => {
    if (!activeTaluk) return []
    return mergePincodeCounts(activeTaluk.pincodes, regions)
  }, [activeTaluk, regions])

  const totalMsmeCount = useMemo(() => {
    if (level === 'taluk') {
      return regions.reduce((sum, r) => sum + r.count, 0) || activeTaluk?.count || 0
    }
    return layoutTaluks.reduce((sum, t) => sum + t.count, 0)
  }, [level, regions, activeTaluk, layoutTaluks])

  const levelPill = level === 'district' ? 'District' : 'Taluk'

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-3">
        {error}
      </div>
    )
  }

  if (!layout || !index) {
    return (
      <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg h-[480px]">
        <p className="text-xs text-slate-400">Loading district map…</p>
      </div>
    )
  }

  if (!layoutKey || layoutTaluks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-lg h-[480px] gap-2 px-6 text-center">
        <p className="text-sm font-medium text-slate-700">{districtName} District</p>
        <p className="text-xs text-slate-500">
          Detailed taluk map is not available for this district yet. Use the regions list to
          explore taluks and pincodes.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 text-xs px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100"
        >
          Back to Tamil Nadu
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {level === 'district'
              ? `${districtName} District`
              : `${activeTaluk?.name ?? talukName} Taluk`}
          </p>
          <p className="text-xs text-slate-500">
            {level === 'district'
              ? 'Click any taluk to drill into pincodes.'
              : `${districtName} · ${pincodes.length} pincodes · ${totalMsmeCount.toLocaleString()} MSMEs`}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
        >
          {levelPill}
        </button>
      </div>

      {level === 'taluk' && !activeTaluk && (
        <div className="flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg h-[480px]">
          <p className="text-xs text-slate-400">Taluk map not found for this selection.</p>
        </div>
      )}

      {(level === 'district' || activeTaluk) && (
        <svg
          viewBox={`0 0 ${viewW} ${viewH}`}
          className="w-full h-auto max-h-[640px] bg-[#eef6fb] rounded-lg border border-slate-200"
          role="img"
          aria-label={
            level === 'district' ? `${districtName} taluks` : `${talukName} pincodes`
          }
        >
          {level === 'district' &&
            layoutTaluks.map((t) => {
              const hoverKey = t.code ?? t.name
              const isHovered = hoveredCode === hoverKey || hoveredCode === t.name

              return (
                <g key={t.name}>
                  <path
                    d={t.d}
                    fill={t.fill}
                    stroke={isHovered ? '#0f172a' : '#ffffff'}
                    strokeWidth={isHovered ? 2.5 : 1.2}
                    strokeLinejoin="round"
                    style={{ cursor: 'pointer', transition: 'fill 120ms ease' }}
                    onMouseEnter={() => onHover(hoverKey)}
                    onMouseLeave={() => onHover(null)}
                    onClick={() => onSelectTaluk(t.code!)}
                  >
                    <title>
                      {t.name} — {t.count.toLocaleString()} MSMEs
                    </title>
                  </path>
                  <text
                    x={t.cx}
                    y={t.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={10}
                    fontWeight={600}
                    paintOrder="stroke"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    fill="#0b1220"
                    pointerEvents="none"
                  >
                    {t.name}
                  </text>
                </g>
              )
            })}

          {level === 'taluk' && activeTaluk && (
            <>
              <path
                d={activeTaluk.d}
                fill={activeTaluk.fill}
                fillOpacity={0.35}
                stroke="#0b1220"
                strokeWidth={1.2}
                pointerEvents="none"
              />
              <text
                x={viewW / 2}
                y={40}
                fontSize={14}
                fontWeight={700}
                fill="#0b1220"
                textAnchor="middle"
                pointerEvents="none"
              >
                {activeTaluk.name} Taluk
              </text>

              {pincodes.map((p) => {
                const r = pincodeRadius(p.count)
                const isHovered = hoveredCode === p.p
                const fill = isHovered ? COLOR_SELECTED : fillColorByCount(p.count)

                return (
                  <g key={p.p}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={r}
                      fill={fill}
                      fillOpacity={0.85}
                      stroke="#ffffff"
                      strokeWidth={2}
                      style={{ cursor: 'pointer', transition: 'fill 120ms ease' }}
                      onMouseEnter={() => onHover(p.p)}
                      onMouseLeave={() => onHover(null)}
                      onClick={() => onSelectPincode(p.p)}
                    >
                      <title>
                        {p.p} — {p.n} — {p.count.toLocaleString()} MSMEs
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
                      strokeLinejoin="round"
                      pointerEvents="none"
                    >
                      {p.p}
                    </text>
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
                      strokeLinejoin="round"
                      pointerEvents="none"
                    >
                      {p.n.length > 18 ? `${p.n.slice(0, 17)}…` : p.n}
                    </text>
                  </g>
                )
              })}
            </>
          )}

          <g transform="translate(36, 36)" pointerEvents="none">
            <text x={0} y={0} fontSize={18} fontWeight={700} fill="#0b1220" textAnchor="middle">
              N
            </text>
            <path d="M0,6 L-7,22 L0,17 L7,22 Z" fill="#0b1220" />
          </g>
        </svg>
      )}
    </div>
  )
}
