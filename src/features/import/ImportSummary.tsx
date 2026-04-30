import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ImportSummaryProps {
  imported: number
  skipped: number
  onReset: () => void
}

export function ImportSummary({ imported, skipped, onReset }: ImportSummaryProps) {
  return (
    <div className="card text-center max-w-md mx-auto py-10">
      <CheckCircle className="w-14 h-14 text-[var(--color-available)] mx-auto mb-4" />
      <h2 className="page-title mb-2">Import Complete</h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Your assets have been imported successfully.
      </p>
      <div className="flex justify-center gap-8 mb-8">
        <div>
          <p className="text-3xl font-bold text-[var(--color-available)]">{imported}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Imported</p>
        </div>
        {skipped > 0 && (
          <div>
            <p className="text-3xl font-bold text-[var(--color-danger)]">{skipped}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">Skipped</p>
          </div>
        )}
      </div>
      <Button variant="secondary" onClick={onReset}>Import More</Button>
    </div>
  )
}
