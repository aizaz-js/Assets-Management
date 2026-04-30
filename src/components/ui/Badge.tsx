import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'available'
  | 'allotted'
  | 'repair'
  | 'retired'
  | 'admin'
  | 'manager'
  | 'finance'
  | 'employee'
  | 'employee_allocated'
  | 'company_allocated'

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  available: 'bg-[var(--color-available-light)] text-[var(--color-available)]',
  allotted: 'bg-[var(--color-allotted-light)] text-[var(--color-allotted)]',
  repair: 'bg-[var(--color-repair-light)] text-[var(--color-repair)]',
  retired: 'bg-[var(--color-retired-light)] text-[var(--color-retired)]',
  admin: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  manager: 'bg-[rgba(56,137,185,0.12)] text-[var(--color-light-blue)]',
  finance: 'bg-[rgba(50,160,226,0.1)] text-[var(--color-royal-blue)]',
  employee: 'bg-[var(--color-border-light)] text-[var(--color-text-secondary)]',
  employee_allocated: 'bg-[rgba(50,160,226,0.1)] text-[var(--color-royal-blue)]',
  company_allocated: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
