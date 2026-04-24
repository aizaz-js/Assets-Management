import { useState } from 'react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AssetTypeIcon } from '@/components/shared/AssetTypeIcon'
import { useUserAssets } from '@/hooks/useUsers'
import { supabase } from '@/lib/supabase'
import { ASSET_TYPE_LABELS } from '@/lib/constants'
import type { Profile } from '@/types'

interface OffboardingModalProps {
  open: boolean
  onClose: () => void
  profile: Profile
  onComplete: () => void
}

export function OffboardingModal({ open, onClose, profile, onComplete }: OffboardingModalProps) {
  const { data: assets } = useUserAssets(profile.id)
  const qc = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      if (assets && assets.length > 0) {
        const { error: assetError } = await supabase
          .from('assets')
          .update({ status: 'available', allotted_user_id: null })
          .in('id', assets.map((a) => a.id))
        if (assetError) throw assetError
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', profile.id)
      if (profileError) throw profileError

      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['user-assets', profile.id] })

      const count = assets?.length ?? 0
      toast.success(
        count > 0
          ? `${profile.name} marked as inactive. ${count} asset${count === 1 ? '' : 's'} released.`
          : `${profile.name} marked as inactive.`
      )
      onComplete()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Offboarding failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Offboard ${profile.name}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="danger" onClick={handleSubmit} loading={submitting}>
            Mark as Inactive & Release Assets
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          This will mark <strong>{profile.name}</strong> as inactive and release all assigned assets back to the available pool.
        </p>

        {assets && assets.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
              Assets to be released ({assets.length})
            </p>
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-lg">
                <AssetTypeIcon type={asset.asset_type} size={16} />
                <span className="font-mono text-xs font-bold text-[var(--color-primary)]">{asset.asset_tag}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">{ASSET_TYPE_LABELS[asset.asset_type]}</span>
                <span className="text-xs text-[var(--color-text-secondary)] ml-auto truncate max-w-[120px]">{asset.specs}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] py-2 text-center">
            No assets assigned — ready to offboard.
          </p>
        )}
      </div>
    </Modal>
  )
}
