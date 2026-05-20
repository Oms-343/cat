/** Schematic Tamil Nadu district layout (viewBox 0 0 420 520). Not survey-grade — for drill-down UX. */

export const TN_VIEWBOX = { width: 420, height: 520 }

export interface DistrictCell {
  code: string
  x: number
  y: number
  w: number
  h: number
}

/** Rounded-rect path from cell bounds */
export function cellToPath(x: number, y: number, w: number, h: number, r = 4): string {
  const x2 = x + w
  const y2 = y + h
  return [
    `M${x + r},${y}`,
    `H${x2 - r}`,
    `Q${x2},${y} ${x2},${y + r}`,
    `V${y2 - r}`,
    `Q${x2},${y2} ${x2 - r},${y2}`,
    `H${x + r}`,
    `Q${x},${y2} ${x},${y2 - r}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    'Z',
  ].join(' ')
}

// Approximate geographic mosaic (38 districts)
export const TN_DISTRICT_CELLS: DistrictCell[] = [
  { code: 'KRI', x: 95, y: 8, w: 52, h: 38 },
  { code: 'VLR', x: 155, y: 12, w: 48, h: 36 },
  { code: 'TPT', x: 210, y: 18, w: 40, h: 32 },
  { code: 'RNP', x: 255, y: 22, w: 38, h: 30 },
  { code: 'TVR', x: 300, y: 28, w: 55, h: 34 },
  { code: 'KAN', x: 318, y: 62, w: 48, h: 32 },
  { code: 'CHN', x: 348, y: 88, w: 42, h: 28 },
  { code: 'CGL', x: 328, y: 118, w: 52, h: 30 },
  { code: 'CHG', x: 338, y: 148, w: 44, h: 26 },
  { code: 'NLG', x: 28, y: 72, w: 48, h: 40 },
  { code: 'ERD', x: 78, y: 88, w: 55, h: 42 },
  { code: 'CBE', x: 138, y: 108, w: 62, h: 48 },
  { code: 'TRP', x: 205, y: 128, w: 50, h: 38 },
  { code: 'TVM', x: 268, y: 155, w: 52, h: 40 },
  { code: 'VLP', x: 318, y: 178, w: 48, h: 36 },
  { code: 'KLK', x: 248, y: 188, w: 42, h: 32 },
  { code: 'SLM', x: 168, y: 168, w: 52, h: 42 },
  { code: 'NMK', x: 118, y: 158, w: 46, h: 36 },
  { code: 'KAR', x: 88, y: 188, w: 44, h: 34 },
  { code: 'TRI', x: 148, y: 218, w: 50, h: 40 },
  { code: 'PMB', x: 198, y: 208, w: 42, h: 34 },
  { code: 'ARI', x: 228, y: 238, w: 40, h: 32 },
  { code: 'CDL', x: 288, y: 218, w: 52, h: 38 },
  { code: 'MYL', x: 318, y: 252, w: 44, h: 32 },
  { code: 'TJV', x: 268, y: 258, w: 48, h: 36 },
  { code: 'TVA', x: 308, y: 288, w: 46, h: 34 },
  { code: 'NAG', x: 338, y: 318, w: 44, h: 32 },
  { code: 'PDK', x: 248, y: 298, w: 48, h: 36 },
  { code: 'DHR', x: 128, y: 48, w: 42, h: 34 },
  { code: 'DDG', x: 108, y: 248, w: 52, h: 40 },
  { code: 'MDU', x: 158, y: 288, w: 58, h: 44 },
  { code: 'THI', x: 98, y: 278, w: 48, h: 38 },
  { code: 'SVG', x: 208, y: 338, w: 48, h: 36 },
  { code: 'RMD', x: 258, y: 358, w: 52, h: 38 },
  { code: 'VDN', x: 168, y: 348, w: 48, h: 36 },
  { code: 'TVL', x: 118, y: 368, w: 55, h: 42 },
  { code: 'THV', x: 218, y: 408, w: 52, h: 38 },
  { code: 'KNY', x: 148, y: 428, w: 48, h: 40 },
]

const cellByCode = new Map(TN_DISTRICT_CELLS.map((c) => [c.code, c]))

export function getDistrictPath(code: string): string | null {
  const cell = cellByCode.get(code)
  if (!cell) return null
  return cellToPath(cell.x, cell.y, cell.w, cell.h)
}

export function getDistrictLabel(code: string): { x: number; y: number } | null {
  const cell = cellByCode.get(code)
  if (!cell) return null
  return { x: cell.x + cell.w / 2, y: cell.y + cell.h / 2 }
}

/** Coimbatore taluk schematic (inside district bounds) */
export const CBE_TALUK_CELLS: DistrictCell[] = [
  { code: 'CBE_MET', x: 20, y: 20, w: 90, h: 70 },
  { code: 'CBE_CBE', x: 120, y: 30, w: 100, h: 80 },
  { code: 'CBE_AVN', x: 230, y: 25, w: 85, h: 65 },
  { code: 'CBE_POL', x: 40, y: 110, w: 95, h: 75 },
  { code: 'CBE_TIR', x: 150, y: 125, w: 100, h: 70 },
  { code: 'CBE_UDU', x: 260, y: 105, w: 90, h: 68 },
]

export const CBE_VIEWBOX = { width: 360, height: 200 }

/** Auto-pack regions in a grid for taluks/pincodes without custom geometry */
export function layoutGridCells(
  codes: string[],
  viewW: number,
  viewH: number,
  cols?: number,
): DistrictCell[] {
  const n = codes.length
  if (n === 0) return []
  const c = cols ?? Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / c)
  const pad = 8
  const cellW = (viewW - pad * (c + 1)) / c
  const cellH = (viewH - pad * (rows + 1)) / rows
  return codes.map((code, i) => {
    const col = i % c
    const row = Math.floor(i / c)
    return {
      code,
      x: pad + col * (cellW + pad),
      y: pad + row * (cellH + pad),
      w: cellW,
      h: cellH,
    }
  })
}
