import { Check } from 'lucide-react'

export interface ProfileSectionTab {
  key: string
  label: string
}

interface ProfileSectionTabsProps {
  sections: ProfileSectionTab[]
  active: string
  onChange: (key: string) => void
  completion?: Record<string, boolean>
}

export function ProfileSectionTabs({
  sections,
  active,
  onChange,
  completion,
}: ProfileSectionTabsProps) {
  return (
    <nav
      className="scrollbar-thin-x flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-hairline -mx-6 px-6 mb-6"
      aria-label="Profile sections"
    >
      {sections.map((s) => {
        const isActive = active === s.key
        const done = completion?.[s.key]
        return (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(s.key)}
            className={[
              'shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-surface-soft text-ink'
                : 'text-muted hover:text-body hover:bg-surface-soft/50',
            ].join(' ')}
          >
            <span className="whitespace-nowrap">{s.label}</span>
            {completion && (
              done ? (
                <Check className="h-3.5 w-3.5 text-success shrink-0" strokeWidth={2.5} aria-hidden />
              ) : (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-hairline shrink-0"
                  aria-label="Incomplete"
                />
              )
            )}
          </button>
        )
      })}
    </nav>
  )
}
