import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import { Upload, Download } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { CSVPreviewTable } from './CSVPreviewTable'
import { ImportSummary } from './ImportSummary'
import { SeedExistingData } from './SeedExistingData'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import { generateAssetTag } from '@/hooks/useAssets'
import { ASSET_TAG_PREFIXES } from '@/lib/constants'
import { cn } from '@/lib/utils'

type Step = 'upload' | 'preview' | 'importing' | 'done'

export interface CSVRow extends Record<string, string> {}

export interface ValidatedRow {
  raw: CSVRow
  index: number
  errors: string[]
  warnings: string[]
  valid: boolean
}

const VALID_ASSET_TYPES = ['laptop','mobile','monitor','mouse','keyboard','webcam','hub','bag','chair','desk','projector','speaker','camera','ups','whiteboard','hdd','other']
const VALID_STATUSES = ['available', 'allotted', 'in_repair', 'retired']
const VALID_CLASSIFICATIONS = ['employee_allocated', 'company_allocated']

const CSV_TEMPLATE_HEADERS = [
  'asset_type', 'classification', 'price_pkr', 'vendor_name', 'vendor_phone',
  'invoice_number', 'purchase_date', 'warranty_expiry', 'warranty_type', 'specs',
  'serial_number', 'pta_status', 'status', 'condition', 'location', 'notes',
]

function downloadTemplate() {
  const csv = CSV_TEMPLATE_HEADERS.join(',') + '\n' +
    'laptop,employee_allocated,150000,Example Vendor,0300-1234567,INV-001,2024-01-15,,manufacturer,Intel Core i7 16GB RAM,SN123456,,available,good,,'
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cogent-assets-import-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

async function validateRows(rows: CSVRow[]): Promise<ValidatedRow[]> {
  // Check for duplicate serial numbers in DB
  const serials = rows.map((r) => r.serial_number).filter(Boolean)
  const tags = rows.map((r) => r.asset_tag).filter(Boolean)

  const { data: existingSerials } = await supabase
    .from('assets')
    .select('serial_number')
    .in('serial_number', serials)

  const { data: existingTags } = await supabase
    .from('assets')
    .select('asset_tag')
    .in('asset_tag', tags)

  const takenSerials = new Set((existingSerials ?? []).map((r) => r.serial_number))
  const takenTags = new Set((existingTags ?? []).map((r) => r.asset_tag))

  return rows.map((raw, index) => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!raw.asset_type) errors.push('Missing asset_type')
    else if (!VALID_ASSET_TYPES.includes(raw.asset_type)) errors.push(`Invalid asset_type: ${raw.asset_type}`)

    if (!raw.classification) errors.push('Missing classification')
    else if (!VALID_CLASSIFICATIONS.includes(raw.classification)) errors.push(`Invalid classification: ${raw.classification}`)

    if (!raw.price_pkr) errors.push('Missing price_pkr')
    else if (isNaN(Number(raw.price_pkr))) errors.push('price_pkr must be a number')

    if (!raw.vendor_name) errors.push('Missing vendor_name')

    if (raw.status && !VALID_STATUSES.includes(raw.status)) errors.push(`Invalid status: ${raw.status}`)

    if (raw.serial_number && takenSerials.has(raw.serial_number)) errors.push(`Duplicate serial number: ${raw.serial_number}`)
    if (raw.asset_tag && takenTags.has(raw.asset_tag)) errors.push(`Duplicate asset tag: ${raw.asset_tag}`)

    if (!raw.specs) warnings.push('specs is empty')
    if (!raw.vendor_phone) warnings.push('vendor_phone is missing')
    if (!raw.purchase_date) warnings.push('purchase_date is missing')

    return { raw, index, errors, warnings, valid: errors.length === 0 }
  })
}

export function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState({ imported: 0, skipped: 0 })
  const fileRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  async function processFile(file: File) {
    if (!file.name.endsWith('.csv')) { toast.error('Only CSV files are accepted'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('File size exceeds 5MB'); return }
    setFileName(file.name)

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const validated = await validateRows(results.data)
        setValidatedRows(validated)
        setStep('preview')
      },
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  async function handleImport() {
    const validRows = validatedRows.filter((r) => r.valid)
    setStep('importing')
    setImportProgress(0)

    let imported = 0
    const chunkSize = 50

    for (let i = 0; i < validRows.length; i += chunkSize) {
      const chunk = validRows.slice(i, i + chunkSize)

      const assetInserts = await Promise.all(
        chunk.map(async (row) => {
          const assetType = row.raw.asset_type
          const prefix = ASSET_TAG_PREFIXES[assetType] ?? 'OTH'
          const tag = row.raw.asset_tag || await generateAssetTag(prefix)
          return {
            asset_tag: tag,
            asset_type: assetType,
            classification: row.raw.classification,
            price_pkr: Number(row.raw.price_pkr) || 0,
            vendor_name: row.raw.vendor_name,
            vendor_phone: row.raw.vendor_phone ?? '',
            invoice_number: row.raw.invoice_number ?? '',
            purchase_date: row.raw.purchase_date || null,
            warranty_expiry: row.raw.warranty_expiry || null,
            warranty_type: row.raw.warranty_type || 'none',
            specs: row.raw.specs ?? '',
            serial_number: row.raw.serial_number || null,
            pta_status: row.raw.pta_status || null,
            status: row.raw.status || 'available',
            condition: row.raw.condition || 'good',
            location: row.raw.location || null,
            notes: row.raw.notes || null,
            created_by: user!.id,
          }
        })
      )

      const { data: inserted, error } = await supabase
        .from('assets')
        .insert(assetInserts)
        .select('id')

      if (!error && inserted) {
        // Audit log entries
        await supabase.from('asset_audit_log').insert(
          inserted.map((a) => ({
            asset_id: a.id,
            action: 'created',
            actor_id: user!.id,
            after_state: { source: 'csv_import' },
          }))
        )
        imported += inserted.length
      }

      setImportProgress(Math.round(((i + chunkSize) / validRows.length) * 100))
    }

    setImportStats({ imported, skipped: validRows.length - imported })
    setStep('done')
  }

  function reset() {
    setStep('upload')
    setFileName('')
    setValidatedRows([])
    setImportProgress(0)
  }

  const validCount = validatedRows.filter((r) => r.valid).length
  const errorCount = validatedRows.filter((r) => !r.valid).length
  const warnCount = validatedRows.filter((r) => r.valid && r.warnings.length > 0).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageHeader
        title="Import Data"
        description="Bulk import assets via CSV"
      />

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {(['upload', 'preview', 'done'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
              step === s || (step === 'importing' && s === 'preview') || (step === 'done' && s === 'done')
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-border-light)] text-[var(--color-text-secondary)]'
            )}>
              {i + 1}
            </div>
            <span className="text-sm text-[var(--color-text-secondary)] capitalize">{s}</span>
            {i < 2 && <div className="w-8 h-px bg-[var(--color-border)]" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-4">
            <SeedExistingData />
            <div className="card space-y-6">
              <div>
                <h3 className="section-title mb-2">Download Template</h3>
                <Button variant="secondary" onClick={downloadTemplate}>
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </Button>
              </div>

              <div>
                <h3 className="section-title mb-2">Upload CSV</h3>
                <div
                  className={cn(
                    'border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer',
                    dragging
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-light-blue)] hover:bg-[var(--color-bg)]'
                  )}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-10 h-10 text-[var(--color-text-secondary)] mx-auto mb-3" />
                  <p className="font-medium text-[var(--color-text)]">Drop your CSV here or click to browse</p>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">Accepts .csv files up to 5MB</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
                />
              </div>
            </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Preview */}
        {(step === 'preview' || step === 'importing') && (
          <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="card flex items-center gap-6">
                <div>
                  <span className="text-xs text-[var(--color-text-secondary)]">File</span>
                  <p className="text-sm font-medium">{fileName}</p>
                </div>
                <div className="flex gap-4 ml-auto">
                  <Stat label="Ready" value={validCount} color="var(--color-available)" />
                  <Stat label="Errors" value={errorCount} color="var(--color-danger)" />
                  <Stat label="Warnings" value={warnCount} color="var(--color-repair)" />
                </div>
              </div>

              {step === 'importing' && (
                <div className="card">
                  <p className="text-sm font-medium mb-2">Importing... {importProgress}%</p>
                  <div className="w-full bg-[var(--color-border-light)] rounded-full h-2">
                    <div
                      className="bg-[var(--color-primary)] h-2 rounded-full transition-all"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <CSVPreviewTable rows={validatedRows} />

              {step === 'preview' && (
                <div className="flex gap-3 justify-end">
                  <Button variant="secondary" onClick={reset}>Re-upload</Button>
                  <Button
                    variant="primary"
                    onClick={handleImport}
                    disabled={validCount === 0}
                  >
                    Import {validCount} Valid Rows
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 3: Done */}
        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ImportSummary
              imported={importStats.imported}
              skipped={importStats.skipped}
              onReset={reset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
    </div>
  )
}
