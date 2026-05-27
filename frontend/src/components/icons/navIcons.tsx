import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Building2,
  Database,
  Home,
  Megaphone,
  ScrollText,
  Users,
} from 'lucide-react'

export const navIconMap: Record<string, LucideIcon> = {
  '/dashboard': Home,
  '/companies': Building2,
  '/masters': Database,
  '/users': Users,
  '/onboarding-drives': Megaphone,
  '/reports': BarChart3,
  '/audit-log': ScrollText,
}

export function NavIcon({ to, className }: { to: string; className?: string }) {
  const Icon = navIconMap[to] ?? Home
  return <Icon className={className ?? 'h-5 w-5 shrink-0'} strokeWidth={1.75} aria-hidden />
}
