import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

const controlCls =
  'w-full h-10 px-3.5 text-sm text-ink bg-transparent border border-hairline rounded-md ' +
  'placeholder:text-muted-soft ' +
  'focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink ' +
  'disabled:bg-surface-soft disabled:text-muted disabled:cursor-not-allowed'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlCls, className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlCls, className)} {...props} />
}

export function Textarea({
  className,
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(controlCls, 'h-auto min-h-[80px] py-2.5', className)}
      {...props}
    />
  )
}

/** @deprecated Use Input — kept for gradual migration */
export const inputClassName = controlCls
