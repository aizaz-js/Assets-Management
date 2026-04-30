import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [localValue, debounceMs, onChange])

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="absolute left-3 w-4 h-4 text-[var(--color-text-secondary)]" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 pr-8"
      />
      {localValue && (
        <button
          onClick={() => {
            setLocalValue('')
            onChange('')
          }}
          className="absolute right-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
