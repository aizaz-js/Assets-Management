import { Table, TableHead, TableBody, Th, Td } from '@/components/ui/Table'
import { Tooltip } from '@/components/ui/Tooltip'
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import type { ValidatedRow } from './ImportPage'
import { cn } from '@/lib/utils'

interface CSVPreviewTableProps {
  rows: ValidatedRow[]
}

export function CSVPreviewTable({ rows }: CSVPreviewTableProps) {
  if (rows.length === 0) return null

  const headers = Object.keys(rows[0]?.raw ?? {})

  return (
    <div className="card p-0 overflow-hidden">
      <Table>
        <TableHead>
          <tr>
            <Th>#</Th>
            <Th>Status</Th>
            {headers.slice(0, 6).map((h) => <Th key={h}>{h}</Th>)}
            <Th>Errors / Warnings</Th>
          </tr>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <tr
              key={row.index}
              className={cn(
                'border-b border-[var(--color-border-light)] text-sm',
                !row.valid && 'bg-[var(--color-danger-light)]/30',
                row.valid && row.warnings.length > 0 && 'bg-amber-50'
              )}
            >
              <Td className="text-[var(--color-text-secondary)] text-xs">{row.index + 1}</Td>
              <Td>
                {!row.valid ? (
                  <AlertCircle className="w-4 h-4 text-[var(--color-danger)]" />
                ) : row.warnings.length > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-[var(--color-available)]" />
                )}
              </Td>
              {headers.slice(0, 6).map((h) => (
                <Td key={h} className="max-w-[120px]">
                  <span className="truncate block text-xs">{row.raw[h] || '—'}</span>
                </Td>
              ))}
              <Td>
                {row.errors.length > 0 && (
                  <Tooltip content={row.errors.join(', ')}>
                    <span className="text-xs text-[var(--color-danger)] cursor-help line-clamp-1">
                      {row.errors[0]}{row.errors.length > 1 ? ` +${row.errors.length - 1}` : ''}
                    </span>
                  </Tooltip>
                )}
                {row.valid && row.warnings.length > 0 && (
                  <Tooltip content={row.warnings.join(', ')}>
                    <span className="text-xs text-amber-600 cursor-help line-clamp-1">
                      {row.warnings[0]}
                    </span>
                  </Tooltip>
                )}
              </Td>
            </tr>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
