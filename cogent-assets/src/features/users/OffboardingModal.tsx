import { useState } from 'react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AssetTypeIcon } from '@/components/shared/AssetTypeIcon'
import { useUserAssets } from '@/hooks/useUsers'
import { useChangeAssetStatus } from '@/hooks/useAssets'
import { supabase } from '@/lib/supabase'
import { ASSET_TYPE_LABELS, CONDITION_OPTIONS } from '@/lib/constants'
import type { Profile, Asset, AssetCondition } from '@/types'

type AssetResolution = 'returned' | 'missing' | 'employee_owned'

interface AssetRow {
  asset: Asset
  resolution: AssetResolution | null
  returnCondition: AssetCondition
}

interface OffboardingModalProps {
  open: boolean
  onClose: () => void
  profile: Profile
  onComplete: () => void
}

export function OffboardingModal({ open, onClose, profile, onComplete }: OffboardingModalProps) {
  const { data: assets } = useUserAssets(profile.id)
  const changeStatus = useChangeAssetStatus()
  const [rows, setRows] = useState<AssetRow[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Initialize rows when modal opens
  useState(() => {
    if (assets) {
      setRows(assets.map((a) => ({ asset: a, resolution: null, returnCondition: 'good' })))
    }
  })

  // Sync rows when assets load
  if (assets && rows.length !== assets.length && rows.length === 0) {
    setRows(assets.map((a) => ({ asset: a, resolution: null, returnCondition: 'good' })))
  }

  function setResolution(assetId: string, resolution: AssetResolution) {
    setRows((r) => r.map((row) => row.asset.id === assetId ? { ...row, resolution } : row))
  }

  function setCondition(assetId: string, condition: AssetCondition) {
    setRows((r) => r.map((row) => row.asset.id === assetId ? { ...row, returnCondition: condition } : row))
  }

  const allResolved = rows.every((r) => r.resolution !== null)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      for (const row of rows) {
        if (row.resolution === 'returned') {
          await changeStatus.mutateAsync({
            id: row.asset.id,
            newStatus: 'available',
            before: row.asset,
            extra: { allotted_user_id: null, condition: row.returnCondition },
          })
        } else if (row.resolution === 'missing') {
          await supabase.from('asset_audit_log').insert({
            asset_id: row.asset.id,
            action: 'returned',
            actor_id: profile.id,
            after_state: { note: 'Asset unrecovered during offboarding' },
          })
        }
      }

      // Mark profile as inactive
      await supabase.from('profiles').update({ status: 'inactive' }).eq('id', profile.id)

      toast.success(`${profile.name} has been offboarded`)
      onComplete()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Offboarding failed')
    } finally {
      setSubmitting(false)
    }
  }

  const hasMissing = rows.some((r) => r.resolution === 'missing')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Offboard ${profile.name}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            variant="danger"
            onClick={handleSubmit}
            disabled={!allResolved}
            loading={submitting}
          >
            Complete Offboarding
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Resolve all assigned assets before marking {profile.name} as inactive.
          {!allResolved && <strong className="text-[var(--color-danger)]"> All assets must be resolved.</strong>}
        </p>

        {hasMissing && (
          <div className="p-3 bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 rounded-lg text-sm text-[var(--color-danger)]">
            Warning: Some assets are marked as missing. An audit log entry will be created.
          </div>
        )}

        {rows.length === 0 && (
          <p className="text-sm text-[var(--color-text-secondary)] py-4 text-center">
            No assets assigned — ready to offboard.
          </p>
        )}

        {rows.map((row) => (
          <div key={row.asset.id} className="border border-[var(--color-border)] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <AssetTypeIcon type={row.asset.asset_type} size={18} />
              <div>
                <span className="font-mono font-bold text-[var(--color-primary)] text-sm">{row.asset.asset_tag}</span>
                <span className="text-xs text-[var(--color-text-secondary)] ml-2">{ASSET_TYPE_LABELS[row.asset.asset_type]}</span>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] ml-auto">{row.asset.specs}</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['returned', 'missing', 'employee_owned'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(row.asset.id, res)}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                    row.resolution === res
                      ? res === 'returned'
                        ? 'bg-[var(--color-available-light)] border-[var(--color-available)] text-[var(--color-available)]'
                        : res === 'missing'
                        ? 'bg-[var(--color-danger-light)] border-[var(--color-danger)] text-[var(--color-danger)]'
                        : 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  {res === 'returned' ? 'Returned' : res === 'missing' ? 'Missing' : 'Employee-Owned'}
                </button>
              ))}
            </div>

            {row.resolution === 'returned' && (
              <div className="mt-3">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Return Condition</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {CONDITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setCondition(row.asset.id, opt.value as AssetCondition)}
                      className={`px-2.5 py-1 rounded text-xs border transition-all ${
                        row.returnCondition === opt.value
                          ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]'
                          : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}
