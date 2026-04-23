import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface UserFilter {
  status?: 'active' | 'inactive'
  search?: string
}

export interface ProfileWithAssetCount extends Profile {
  asset_count: number
}

export function useUsers(filter: UserFilter = {}) {
  return useQuery<ProfileWithAssetCount[]>({
    queryKey: ['users', filter],
    queryFn: async () => {
      let q = supabase.from('profiles').select('*').order('name')

      if (filter.status) q = q.eq('status', filter.status)
      if (filter.search) {
        q = q.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`)
      }

      const { data: profiles, error } = await q
      if (error) throw error

      const { data: assets } = await supabase
        .from('assets')
        .select('allotted_user_id')
        .not('allotted_user_id', 'is', null)
        .neq('status', 'retired')

      const countMap: Record<string, number> = {}
      for (const a of assets ?? []) {
        if (a.allotted_user_id) {
          countMap[a.allotted_user_id] = (countMap[a.allotted_user_id] ?? 0) + 1
        }
      }

      return (profiles ?? []).map((p) => ({ ...p, asset_count: countMap[p.id] ?? 0 }))
    },
    staleTime: 30 * 1000,
  })
}

export function useUserAssets(userId: string | null) {
  return useQuery({
    queryKey: ['user-assets', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('allotted_user_id', userId!)
        .neq('status', 'retired')
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: {
      name: string
      email: string
      role: Profile['role']
      designation?: string | null
      department?: string | null
      engagement_type?: Profile['engagement_type']
      engagement_end_date?: string | null
    }) => {
      const { error } = await supabase.from('profiles').insert({
        ...values,
        engagement_type: values.engagement_type ?? 'permanent',
        status: 'active',
        avatar_url: null,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: {
      id: string
      values: {
        name: string
        role: Profile['role']
        designation?: string | null
        department?: string | null
        engagement_type: Profile['engagement_type']
        engagement_end_date?: string | null
        status: 'active' | 'inactive'
      }
    }) => {
      const { error } = await supabase.from('profiles').update(values).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
