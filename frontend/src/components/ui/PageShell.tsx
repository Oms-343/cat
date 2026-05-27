import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

type Width = 'md' | 'lg' | 'xl'

const widthCls: Record<Width, string> = {
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
}

interface PageShellProps {
  width?: Width
  className?: string
  children: ReactNode
}

export function PageShell({ width = 'xl', className, children }: PageShellProps) {
  return (
    <div className={cn('mx-auto w-full px-6 lg:px-8 py-8', widthCls[width], className)}>
      {children}
    </div>
  )
}
