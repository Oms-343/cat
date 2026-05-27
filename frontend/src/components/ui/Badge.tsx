import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

type Tone = 'neutral' | 'success' | 'warning' | 'error' | 'accent'

const toneCls: Record<Tone, string> = {
  neutral: 'bg-surface-card text-ink border-hairline',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  accent: 'bg-blue-50 text-blue-800 border-blue-200',
}

interface BadgeProps {
  tone?: Tone
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] font-semibold uppercase tracking-wide',
        'px-1.5 py-0.5 rounded border',
        toneCls[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
