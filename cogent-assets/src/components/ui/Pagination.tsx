import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const pages = getPageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] bg-white">
      <p className="text-xs text-[var(--color-text-secondary)]">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-xs text-[var(--color-text-secondary)]">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'min-w-[28px] h-7 px-1.5 rounded text-xs font-medium transition-colors',
                p === page
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]',
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
