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
  icon?: string
}

export function useCategories() {
  return useQuery<CategoryConfig[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('id, name, slug, classification, icon, is_active, sort_order, tag_prefix')
        .order('classification', { ascending: true })
        .order('sort_order', { ascending: true })

      if (error) throw error

      return (data ?? []).map((row) => ({
        id: row.id,
        type_key: row.slug ?? '',
        label: row.name ?? ASSET_TYPE_LABELS[row.slug ?? ''] ?? '',
        tag_prefix: row.tag_prefix ?? ASSET_TAG_PREFIXES[row.slug ?? ''] ?? 'OTH',
        classification: (row.classification ?? 'employee_allocated') as CategoryConfig['classification'],
        is_active: row.is_active ?? true,
        sort_order: row.sort_order ?? 0,
        icon: row.icon ?? undefined,
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
          tag_prefix: config.tag_prefix,
          is_active: config.is_active,
          icon: config.icon ?? null,
        })
        .eq('id', config.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useAddCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: {
      name: string
      classification: 'employee_allocated' | 'company_allocated'
      icon: string
      sort_order: number
      tag_prefix: string
    }) => {
      const slug = values.name.toLowerCase().replace(/\s+/g, '_')
      const { error } = await supabase.from('asset_categories').insert({
        name: values.name,
        slug,
        classification: values.classification,
        icon: values.icon,
        is_active: true,
        sort_order: values.sort_order,
        tag_prefix: values.tag_prefix.toUpperCase() || 'OTH',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('asset_categories')
        .delete()
        .eq('id', categoryId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export function useReorderCategories() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        const { error } = await supabase
          .from('asset_categories')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
        if (error) throw error
      }
    },
    onMutate: async (items) => {
      await qc.cancelQueries({ queryKey: ['categories'] })
      const previous = qc.getQueryData<CategoryConfig[]>(['categories'])
      qc.setQueryData<CategoryConfig[]>(['categories'], (old) => {
        if (!old) return old
        const orderMap = new Map(items.map((i) => [i.id, i.sort_order]))
        return old.map((cat) => ({
          ...cat,
          sort_order: orderMap.get(cat.id) ?? cat.sort_order,
        }))
      })
      return { previous }
    },
    onError: (_err, _items, context) => {
      if (context?.previous) {
        qc.setQueryData(['categories'], context.previous)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
