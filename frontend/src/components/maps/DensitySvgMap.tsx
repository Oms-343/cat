import { useMemo } from 'react'
import { cellToPath, type DistrictCell } from './tamilNaduLayout'
import { fillForCount } from './mapColors'

export interface MapRegion {
  code: string
  name: string
  count: number
}

export interface DensitySvgMapProps {
  regions: MapRegion[]
  viewWidth: number
  viewHeight: number
  cells?: DistrictCell[]
  maxCount?: number
  hoveredCode: string | null
  onHover: (code: string | null) => void
  onSelect: (code: string) => void
  disableEmpty?: boolean
  title?: string
}

function strokeForCount(count: number): string {
  return count === 0 ? '#cbd5e1' : '#1e3a8a'
}

export function DensitySvgMap({
  regions,
  viewWidth,
  viewHeight,
  cells: presetCells,
  maxCount: maxProp,
  hoveredCode,
  onHover,
  onSelect,
  disableEmpty = false,
  title = 'Map',
}: DensitySvgMapProps) {
  const max = maxProp ?? Math.max(0, ...regions.map((r) => r.count))
  const countByCode = useMemo(() => new Map(regions.map((r) => [r.code, r])), [regions])

  const cells = useMemo(() => {
    if (presetCells) return presetCells
    const cols = Math.ceil(Math.sqrt(regions.length)) || 1
    const rows = Math.ceil(regions.length / cols)
    const pad = 10
    const w = (viewWidth - pad * (cols + 1)) / cols
    const h = (viewHeight - pad * (rows + 1)) / rows
    return regions.map((r, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      return {
        code: r.code,
        x: pad + col * (w + pad),
        y: pad + row * (h + pad),
        w,
        h,
      }
    })
  }, [presetCells, regions, viewWidth, viewHeight])

  const hovered = hoveredCode ? countByCode.get(hoveredCode) : null

  return (
    <div className="relative">
      <p className="text-xs text-slate-500 mb-2">{title}</p>
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="w-full h-auto max-h-[480px] bg-slate-50 rounded-lg border border-slate-200"
        role="img"
        aria-label={title}
      >
        {cells.map((cell) => {
          const region = countByCode.get(cell.code)
          const count = region?.count ?? 0
          const name = region?.name ?? cell.code
          const disabled = disableEmpty && count === 0
          const isHovered = hoveredCode === cell.code
          const path = cellToPath(cell.x, cell.y, cell.w, cell.h, 6)
          const lx = cell.x + cell.w / 2
          const ly = cell.y + cell.h / 2
          const showLabel = cell.w > 36 && cell.h > 28

          return (
            <g
              key={cell.code}
              className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              onMouseEnter={() => !disabled && onHover(cell.code)}
              onMouseLeave={() => onHover(null)}
              onClick={() => !disabled && onSelect(cell.code)}
            >
              <path
                d={path}
                fill={count === 0 ? '#f1f5f9' : fillForCount(count, max)}
                stroke={isHovered ? '#2563eb' : strokeForCount(count)}
                strokeWidth={isHovered ? 2.5 : 1}
                opacity={disabled ? 0.45 : 1}
              />
              {showLabel && (
                <>
                  <text
                    x={lx}
                    y={ly - 4}
                    textAnchor="middle"
                    className="fill-slate-800 pointer-events-none"
                    style={{ fontSize: Math.min(9, cell.w / 5), fontWeight: 600 }}
                  >
                    {name.length > 14 ? `${name.slice(0, 12)}…` : name}
                  </text>
                  <text
                    x={lx}
                    y={ly + 10}
                    textAnchor="middle"
                    className="fill-slate-700 pointer-events-none"
                    style={{ fontSize: Math.min(11, cell.w / 4), fontWeight: 700 }}
                  >
                    {count}
                  </text>
                </>
              )}
            </g>
          )
        })}
      </svg>

      {hovered && (
        <div className="absolute top-10 right-3 bg-white/95 border border-slate-200 shadow-md rounded-lg px-3 py-2 text-sm pointer-events-none z-10">
          <p className="font-semibold text-slate-900">{hovered.name}</p>
          <p className="text-slate-600 tabular-nums">
            <strong>{hovered.count.toLocaleString()}</strong> MSMEs
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[#1d4ed8] border border-slate-300" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[#60a5fa] border border-slate-300" /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[#fcd34d] border border-slate-300" /> Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" /> None
        </span>
      </div>
    </div>
  )
}
