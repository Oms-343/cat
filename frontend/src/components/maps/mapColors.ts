export function fillForCount(count: number, max: number): string {
  if (count === 0) return '#cbd5e1'
  if (max === 0) return '#cbd5e1'
  const ratio = count / max
  if (ratio > 0.66) return '#1d4ed8'
  if (ratio > 0.33) return '#60a5fa'
  return '#fcd34d'
}

export function markerScaleForCount(count: number, max: number): number {
  if (count === 0 || max === 0) return 6
  const ratio = count / max
  return 8 + ratio * 14
}
