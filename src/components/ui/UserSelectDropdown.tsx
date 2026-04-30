import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Profile } from '@/types'

interface UserSelectDropdownProps {
  profiles: Profile[]
  value: string
  onSelect: (userId: string) => void
  error?: string | null
  placeholder?: string
  label?: string
}

export function UserSelectDropdown({
  profiles,
  value,
  onSelect,
  error,
  placeholder = 'Select employee...',
  label,
}: UserSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = [...profiles]
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  const selectedUser = profiles.find((p) => p.id === value)

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
      )}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-left text-sm flex justify-between items-center bg-white hover:border-[var(--color-primary)] transition-colors"
        >
          <span className={selectedUser ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'}>
            {selectedUser ? selectedUser.name : placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg">
            <div className="p-2 border-b border-[var(--color-border)]">
              <input
                autoFocus
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm px-2 py-1.5 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-[var(--color-text-secondary)]">No employees found</div>
              )}
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p.id)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col border-b border-[var(--color-border)] last:border-0 ${p.id === value ? 'bg-blue-50' : ''}`}
                >
                  <span className="font-medium text-[var(--color-text)]">{p.name}</span>
                  <span className="text-xs text-[var(--color-text-secondary)]">{p.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  )
}
