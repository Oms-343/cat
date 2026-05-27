import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

type Variant = 'default' | 'muted' | 'elevated'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  padding?: 'none' | 'sm' | 'md'
  children: ReactNode
}

const variantCls: Record<Variant, string> = {
  /** Border-only — sits on the page background without a white fill */
  default: 'border border-hairline',
  muted: 'bg-surface-card/80 border border-hairline',
  /** Tables and dense content — subtle tint, not pure white */
  elevated: 'bg-surface-card border border-hairline',
}

const paddingCls = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
}

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn('rounded-lg', variantCls[variant], paddingCls[padding], className)}
      {...props}
    >
      {children}
    </div>
  )
}
