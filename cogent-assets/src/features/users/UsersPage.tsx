import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableHead, TableBody, Th, Td, Tr, TableSkeleton } from '@/components/ui/Table'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tooltip } from '@/components/ui/Tooltip'
import { UserDetailDrawer } from './UserDetailDrawer'
import { AddEmployeeModal } from './AddEmployeeModal'
import { EditUserModal } from './EditUserModal'
import { useUsers } from '@/hooks/useUsers'
import type { Profile, UserRole } from '@/types'
import { Users, UserPlus, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

const roleBadgeVariant: Record<UserRole, 'admin' | 'manager' | 'finance' | 'employee'> = {
  admin: 'admin',
  manager: 'manager',
  finance: 'finance',
  employee: 'employee',
}

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('')
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editProfile, setEditProfile] = useState<Profile | null>(null)

  const { data: users, isLoading } = useUsers({
    status: statusFilter || undefined,
    search: search || undefined,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageHeader
        title="Users"
        description="Manage team members and their asset assignments"
        actions={
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Employee
          </Button>
        }
      />

      <div className="card p-0 overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, email..."
            className="w-72"
          />
          <div className="flex gap-1 ml-auto">
            {(['', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded text-sm font-medium border transition-all',
                  statusFilter === s
                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                )}
              >
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <Table>
          <TableHead>
            <tr>
              <Th>User</Th>
              <Th>Designation</Th>
              <Th>Department</Th>
              <Th>Assets</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </TableHead>
          <TableBody>
            {isLoading && <TableSkeleton rows={6} cols={6} />}
            {!isLoading && (users ?? []).map((user) => (
              <Tr key={user.id} onClick={() => setSelectedProfile(user)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatar_url} name={user.name} size="md" />
                    <div>
                      <p className="font-medium text-sm text-[var(--color-text)]">{user.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>{user.designation ?? '—'}</Td>
                <Td>{user.department ?? '—'}</Td>
                <Td>
                  <span className={cn(
                    'text-sm font-semibold',
                    user.asset_count > 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
                  )}>
                    {user.asset_count}
                  </span>
                </Td>
                <Td>
                  <Badge variant={roleBadgeVariant[user.role]}>{user.role}</Badge>
                </Td>
                <Td>
                  <Badge variant={user.status === 'active' ? 'available' : 'retired'}>
                    {user.status}
                  </Badge>
                </Td>
                <Td onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  <Tooltip content="Edit user">
                    <button
                      className="p-1.5 rounded hover:bg-gray-100 transition-colors text-slate-500 hover:text-[var(--color-primary)]"
                      onClick={() => setEditProfile(user)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </Td>
              </Tr>
            ))}
          </TableBody>
        </Table>

        {!isLoading && (users ?? []).length === 0 && (
          <EmptyState
            icon={Users}
            title="No users found"
            description={search ? 'Try adjusting your search' : 'Users appear here after signing in'}
          />
        )}
      </div>

      <UserDetailDrawer
        profile={selectedProfile}
        open={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />

      <AddEmployeeModal open={addOpen} onClose={() => setAddOpen(false)} />

      {editProfile && (
        <EditUserModal
          open={!!editProfile}
          onClose={() => setEditProfile(null)}
          profile={editProfile}
        />
      )}
    </motion.div>
  )
}
