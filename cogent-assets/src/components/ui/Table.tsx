import { cn } from '@/lib/utils'

interface TableProps {
  children: React.ReactNode
  className?: string
}

interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  )
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('table-header text-left', className)}>{children}</th>
}

export function Td({
  children,
  className,
  onClick,
}: {
  children?: React.ReactNode
  className?: string
  onClick?: React.MouseEventHandler<HTMLTableCellElement>
}) {
  return <td className={cn('table-cell', className)} onClick={onClick}>{children}</td>
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <tr onClick={onClick} className={cn('table-row', className)}>
      {children}
    </tr>
  )
}

export function TableSkeleton({ rows = 5, cols = 6 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-[var(--color-border-light)]">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="table-cell">
              <div className="h-4 bg-[var(--color-border-light)] rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
