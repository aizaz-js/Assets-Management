import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ASSET_TYPE_LABELS, ASSET_TAG_PREFIXES, EMPLOYEE_ONLY_TYPES, COMPANY_ONLY_TYPES } from '@/lib/constants'

export interface CategoryConfig {
  type_key: string
  label: string
  tag_prefix: string
  classification: 'employee_allocated' | 'company_allocated'
  is_active: boolean
  sort_order: number
}

const DEFAULT_CLASSIFICATION: Record<string, CategoryConfig['classification']> = {
  ...Object.fromEntries(EMPLOYEE_ONLY_TYPES.map((t) => [t, 'employee_allocated'])),
  ...Object.fromEntries(COMPANY_ONLY_TYPES.map((t) => [t, 'company_allocated'])),
  other: 'employee_allocated',
}

export function useCategories() {
  return useQuery<CategoryConfig[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('asset_category_config').select('*')
      const dbMap = Object.fromEntries((data ?? []).map((r) => [r.type_key, r]))

      return Object.entries(ASSET_TYPE_LABELS).map(([key, defaultLabel], i) => ({
        type_key: key,
        label: dbMap[key]?.label ?? defaultLabel,
        tag_prefix: dbMap[key]?.tag_prefix ?? (ASSET_TAG_PREFIXES[key] ?? 'OTH'),
        classification: (dbMap[key]?.classification ?? DEFAULT_CLASSIFICATION[key] ?? 'employee_allocated') as CategoryConfig['classification'],
        is_active: dbMap[key]?.is_active ?? true,
        sort_order: dbMap[key]?.sort_order ?? i,
      }))
    },
    staleTime: 60 * 1000,
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (config: Omit<CategoryConfig, 'sort_order'> & { sort_order?: number }) => {
      const { error } = await supabase
        .from('asset_category_config')
        .upsert(config, { onConflict: 'type_key' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}
