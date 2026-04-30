import { useState } from 'react'

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initial
    } catch {
      return initial
    }
  })

  function set(val: T | ((prev: T) => T)) {
    setValue((prev) => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }

  return [value, set] as const
}
