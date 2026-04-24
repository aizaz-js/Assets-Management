import { Drawer } from '@/components/ui/Drawer'
import { AssetStatusBadge } from '@/components/shared/AssetStatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useAsset, useAssetAuditLog } from '@/hooks/useAssets'
import { useRepairs } from '@/hooks/useRepairs'
import { ASSET_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatPKR } from '@/lib/utils'
import type { Asset } from '@/types'
import { Button } from '@/components/ui/Button'

interface AssetDetailDrawerProps {
  assetId: string | null
  open: boolean
  onClose: () => void
  onEdit: (asset: Asset) => void
}

export function AssetDetailDrawer({ assetId, open, onClose, onEdit }: AssetDetailDrawerProps) {
  const { data: asset, isLoading } = useAsset(assetId)
  const { data: auditLog } = useAssetAuditLog(assetId)
  const { data: repairs } = useRepairs({})

  const assetRepairs = repairs?.filter((r) => r.asset_id === assetId) ?? []

  return (
    <Drawer open={open} onClose={onClose} title="Asset Details" width={480}>
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="md" className="text-[var(--color-primary)]" />
        </div>
      )}
      {asset && (
        <div className="px-6 py-4 space-y-6">
          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onEdit(asset)}>
              Edit Asset
            </Button>
          </div>

          {/* Asset Info */}
          <section>
            <h3 className="section-title mb-3">Asset Information</h3>
            <div className="space-y-2">
              <Row label="Asset Tag" value={<span className="font-mono font-bold text-[var(--color-primary)]">{asset.asset_tag}</span>} />
              <Row label="Type" value={ASSET_TYPE_LABELS[asset.asset_type]} />
              <Row label="Status" value={<AssetStatusBadge status={asset.status} />} />
              <Row label="Classification" value={
                <Badge variant={asset.classification}>{asset.classification === 'employee_allocated' ? 'Employee Allocated' : 'Company Allocated'}</Badge>
              } />
              <Row label="Specs" value={asset.specs} />
              {asset.serial_number && <Row label="Serial No." value={<span className="font-mono">{asset.serial_number}</span>} />}
              {asset.asset_type === 'mobile' && asset.pta_status && <Row label="PTA Status" value={asset.pta_status.replace('_', ' ')} />}
            </div>
          </section>

          {/* Vendor Details */}
          <section>
            <h3 className="section-title mb-3">Vendor Details</h3>
            <div className="space-y-2">
              <Row label="Vendor" value={asset.vendor_name} />
              <Row label="Phone" value={asset.vendor_phone} />
              <Row label="Invoice" value={asset.invoice_number} />
              <Row label="Price" value={formatPKR(asset.price_pkr)} />
              <Row label="Purchase Date" value={formatDate(asset.purchase_date)} />
            </div>
          </section>

          {/* Assignment */}
          {asset.allotted_user && (
            <section>
              <h3 className="section-title mb-3">Assigned To</h3>
              <div className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-lg">
                <Avatar src={asset.allotted_user.avatar_url} name={asset.allotted_user.name} size="md" />
                <div>
                  <p className="font-medium text-sm text-[var(--color-text)]">{asset.allotted_user.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{asset.allotted_user.email}</p>
                </div>
              </div>
            </section>
          )}
          {asset.location && (
            <section>
              <h3 className="section-title mb-3">Location</h3>
              <p className="text-sm text-[var(--color-text)]">{asset.location}</p>
            </section>
          )}

          {/* Repair History */}
          {assetRepairs.length > 0 && (
            <section>
              <h3 className="section-title mb-3">Repair History</h3>
              <div className="space-y-2">
                {assetRepairs.map((r) => (
                  <div key={r.id} className="p-3 bg-[var(--color-bg)] rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{r.repair_vendor_name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-[var(--color-available-light)] text-[var(--color-available)]' : 'bg-[var(--color-repair-light)] text-[var(--color-repair)]'}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-[var(--color-text-secondary)] text-xs">{r.fault_description}</p>
                    <p className="text-[var(--color-text-secondary)] text-xs mt-1">Sent: {formatDate(r.date_sent)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Audit Log */}
          {auditLog && auditLog.length > 0 && (
            <section>
              <h3 className="section-title mb-3">Audit Log</h3>
              <div className="space-y-2">
                {auditLog.map((log) => (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-[var(--color-primary)]">{log.action.replace(/_/g, ' ')}</span>
                      {log.actor && <span className="text-[var(--color-text-secondary)]"> by {log.actor.name}</span>}
                      <p className="text-xs text-[var(--color-text-secondary)]">{formatDate(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {asset.notes && (
            <section>
              <h3 className="section-title mb-2">Notes</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{asset.notes}</p>
            </section>
          )}
        </div>
      )}
    </Drawer>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-[var(--color-text-secondary)] w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-[var(--color-text)] flex-1 break-words min-w-0">{value ?? '—'}</span>
    </div>
  )
}
