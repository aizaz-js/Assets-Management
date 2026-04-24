import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ASSET_TYPE_LABELS, ASSET_TAG_PREFIXES } from '@/lib/constants'

export interface CategoryConfig {
  id: string
  type_key: string
  label: string
  tag_prefix: string
  classification: 'employee_allocated' | 'company_allocated'
  is_active: boolean
  sort_order: number
}

export function useCategories() {
  return useQuery<CategoryConfig[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .order('classification', { ascending: true })
        .order('sort_order', { ascending: true })

      if (error) throw error

      return (data ?? []).map((row) => ({
        id: row.id,
        type_key: row.slug ?? row.type_key ?? '',
        label: row.name ?? ASSET_TYPE_LABELS[row.slug ?? row.type_key ?? ''] ?? '',
        tag_prefix: row.tag_prefix ?? ASSET_TAG_PREFIXES[row.slug ?? row.type_key ?? ''] ?? 'OTH',
        classification: (row.classification ?? 'employee_allocated') as CategoryConfig['classification'],
        is_active: row.is_active ?? true,
        sort_order: row.sort_order ?? 0,
      }))
    },
    staleTime: 60 * 1000,
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (config: CategoryConfig) => {
      const { error } = await supabase
        .from('asset_categories')
        .update({
          name: config.label,
          is_active: config.is_active,
        })
        .eq('id', config.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}
