import { Bell } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/useAuth'
import type { UserRole } from '@/types'

const routeTitles: Record<string, string> = {
  '/assets': 'Assets',
  '/repair': 'Repair Tracking',
  '/users': 'Users',
  '/import': 'Import Data',
}

const roleBadgeVariant: Record<UserRole, 'admin' | 'manager' | 'finance' | 'employee'> = {
  admin: 'admin',
  manager: 'manager',
  finance: 'finance',
  employee: 'employee',
}

export function TopBar({ sidebarWidth }: { sidebarWidth: number }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const title = Object.entries(routeTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? 'Cogent Assets'

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-white border-b border-[var(--color-border)] shadow-[var(--shadow-card)] z-20 flex items-center px-6 justify-between"
      style={{ left: sidebarWidth }}
    >
      <h1 className="text-lg font-semibold text-[var(--color-primary)]">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Bell — future use */}
        <button className="p-2 rounded text-[var(--color-border)] cursor-not-allowed opacity-50" disabled>
          <Bell className="w-5 h-5" />
        </button>

        {/* Avatar dropdown */}
        {profile && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 hover:bg-[var(--color-bg)] rounded-lg px-2 py-1.5 transition-colors">
                <Avatar src={profile.avatar_url} name={profile.name} size="sm" />
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-[var(--color-text)] leading-none">{profile.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{profile.email}</p>
                </div>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="bg-white rounded-lg border border-[var(--color-border)] shadow-[var(--shadow-dropdown)] w-56 z-50 py-1"
              >
                <div className="px-4 py-3 border-b border-[var(--color-border)]">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{profile.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{profile.email}</p>
                  <div className="mt-2">
                    <Badge variant={roleBadgeVariant[profile.role]}>{profile.role}</Badge>
                  </div>
                </div>
                <DropdownMenu.Separator className="h-px bg-[var(--color-border)] my-1" />
                <DropdownMenu.Item
                  className="flex items-center px-4 py-2 text-sm text-[var(--color-danger)] cursor-pointer hover:bg-[var(--color-danger-light)] outline-none"
                  onSelect={signOut}
                >
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </header>
  )
}
