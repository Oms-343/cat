import { cn } from '../../utils/cn'

export interface RegionListItem {
  code: string
  name: string
  count: number
  subtitle?: string
  dotColor: string
}

interface RegionsListPanelProps {
  items: RegionListItem[]
  hoveredCode: string | null
  onHover: (code: string | null) => void
  onSelect: (item: RegionListItem) => void
  emptyMessage?: string
  className?: string
}

/** Scrollable region list aligned with map height; sizes to content when short. */
export function RegionsListPanel({
  items,
  hoveredCode,
  onHover,
  onSelect,
  emptyMessage = 'No regions in the list yet — use the map to explore.',
  className,
}: RegionsListPanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col w-full self-start border border-hairline rounded-lg overflow-hidden',
        className,
      )}
    >
      <div className="shrink-0 px-3 py-2 border-b border-hairline bg-surface-soft">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Regions</h2>
      </div>

      {items.length === 0 ? (
        <p className="px-3 py-6 text-xs text-muted text-center">{emptyMessage}</p>
      ) : (
        <ul
          className={cn(
            'overflow-y-auto overscroll-contain scrollbar-thin',
            /* Match map column height when list is long; shrink when few items */
            'max-h-[min(672px,calc(100dvh-12rem))]',
          )}
        >
          {items.map((item) => {
            const isEmpty = item.count === 0
            const isHovered = hoveredCode === item.code

            return (
              <li key={item.code} className="border-b border-hairline-soft last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  onMouseEnter={() => onHover(item.code)}
                  onMouseLeave={() => onHover(null)}
                  className={cn(
                    'w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors',
                    isHovered ? 'bg-surface-soft' : 'hover:bg-surface-soft/80',
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/5"
                    style={{ backgroundColor: item.dotColor }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm leading-tight truncate',
                        isEmpty ? 'text-muted' : 'font-medium text-ink',
                      )}
                    >
                      {item.name}
                    </p>
                    {item.subtitle && (
                      <p className="text-[10px] text-muted-soft font-mono leading-none mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      'shrink-0 min-w-[1.75rem] text-center text-xs font-semibold tabular-nums rounded-md px-1.5 py-0.5',
                      isEmpty
                        ? 'text-muted-soft bg-surface-soft'
                        : 'text-ink bg-surface-card',
                    )}
                  >
                    {item.count}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
