import { useState } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AssetStatusBadge } from '@/components/shared/AssetStatusBadge'
import { AssetTypeIcon } from '@/components/shared/AssetTypeIcon'
import { OffboardingModal } from './OffboardingModal'
import { useUserAssets } from '@/hooks/useUsers'
import type { Profile, UserRole } from '@/types'

interface UserDetailDrawerProps {
  profile: Profile | null
  open: boolean
  onClose: () => void
}

const roleBadgeVariant: Record<UserRole, 'admin' | 'manager' | 'finance' | 'employee'> = {
  admin: 'admin',
  manager: 'manager',
  finance: 'finance',
  employee: 'employee',
}

export function UserDetailDrawer({ profile, open, onClose }: UserDetailDrawerProps) {
  const [offboardingOpen, setOffboardingOpen] = useState(false)
  const { data: assets } = useUserAssets(profile?.id ?? null)

  if (!profile) return null

  return (
    <>
      <Drawer open={open} onClose={onClose} title="User Details" width={480}>
        <div className="px-6 py-4 space-y-6">
          {/* Profile header */}
          <div className="flex items-start gap-4 p-4 bg-[var(--color-bg)] rounded-lg">
            <Avatar src={profile.avatar_url} name={profile.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[var(--color-text)]">{profile.name}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{profile.email}</p>
              {profile.designation && (
                <p className="text-sm text-[var(--color-text-secondary)]">{profile.designation}</p>
              )}
              {profile.department && (
                <p className="text-xs text-[var(--color-text-secondary)]">{profile.department}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={roleBadgeVariant[profile.role]}>{profile.role}</Badge>
                <Badge variant={profile.status === 'active' ? 'available' : 'retired'}>
                  {profile.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Assets */}
          <section>
            <h3 className="section-title mb-3">
              Assigned Assets
              {assets && assets.length > 0 && (
                <span className="ml-2 text-sm font-normal text-[var(--color-text-secondary)]">
                  ({assets.length})
                </span>
              )}
            </h3>
            {assets && assets.length > 0 ? (
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-lg">
                    <AssetTypeIcon type={asset.asset_type} size={18} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--color-primary)]">{asset.asset_tag}</span>
                        <AssetStatusBadge status={asset.status} />
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">{asset.specs}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)]">No assets assigned</p>
            )}
          </section>

          {/* Offboard */}
          {profile.status === 'active' && (
            <div className="border-t border-[var(--color-border)] pt-4">
              <Button
                variant="danger"
                className="w-full justify-center"
                onClick={() => setOffboardingOpen(true)}
              >
                Mark as Inactive (Offboard)
              </Button>
            </div>
          )}
        </div>
      </Drawer>

      {offboardingOpen && (
        <OffboardingModal
          open={offboardingOpen}
          onClose={() => setOffboardingOpen(false)}
          profile={profile}
          onComplete={() => { setOffboardingOpen(false); onClose() }}
        />
      )}
    </>
  )
}
