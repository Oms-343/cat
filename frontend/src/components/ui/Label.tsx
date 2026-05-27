import type { LabelHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  children: ReactNode
}

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-sm font-medium text-ink', className)}
      {...props}
    >
      {children}
      {required && <span className="text-error ml-0.5">*</span>}
    </label>
  )
}
