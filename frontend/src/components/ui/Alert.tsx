import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

type Variant = 'error' | 'success' | 'warning' | 'info'

const variantCls: Record<Variant, string> = {
  error: 'text-red-800 bg-red-50 border-red-200',
  success: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  warning: 'text-amber-800 bg-amber-50 border-amber-200',
  info: 'text-ink bg-surface-soft border-hairline',
}

interface AlertProps {
  variant?: Variant
  className?: string
  children: ReactNode
}

export function Alert({ variant = 'info', className, children }: AlertProps) {
  return (
    <div
      className={cn(
        'text-sm border rounded-md px-4 py-3',
        variantCls[variant],
        className,
      )}
      role="alert"
    >
      {children}
    </div>
  )
}
