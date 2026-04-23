import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/useAuth'
import type { RepairRecord, RepairStatus } from '@/types'

interface RepairsFilter {
  status?: RepairStatus | RepairStatus[]
}

export function useRepairs(filter: RepairsFilter = {}) {
  return useQuery<RepairRecord[]>({
    queryKey: ['repairs', filter],
    queryFn: async () => {
      let q = supabase
        .from('repair_records')
        .select('*, asset:assets!asset_id(id,asset_tag,asset_type,specs,allotted_user_id)')
        .order('created_at', { ascending: false })

      if (Array.isArray(filter.status)) {
        q = q.in('status', filter.status)
      } else if (filter.status) {
        q = q.eq('status', filter.status)
      }

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const data = query.state.data as RepairRecord[] | undefined
      const hasOpen = data?.some((r) => r.status === 'open')
      return hasOpen ? 60 * 1000 : false
    },
  })
}

export function useCreateRepair() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (values: Omit<RepairRecord, 'id' | 'created_at' | 'completed_at' | 'actual_return_date' | 'final_cost_pkr' | 'resolved_status' | 'asset'>) => {
      const { data, error } = await supabase
        .from('repair_records')
        .insert({ ...values, created_by: user!.id, status: 'open' })
        .select()
        .single()
      if (error) throw error

      // Update asset status to in_repair
      await supabase.from('assets').update({ status: 'in_repair' }).eq('id', values.asset_id)

      // Audit log
      await supabase.from('asset_audit_log').insert({
        asset_id: values.asset_id,
        action: 'repair_opened',
        actor_id: user!.id,
        after_state: { repair_id: data.id },
      })

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repairs'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export function useCompleteRepair() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      repairId,
      assetId,
      finalCost,
      newStatus,
      allottedUserId,
    }: {
      repairId: string
      assetId: string
      finalCost: string
      newStatus: 'available' | 'allotted' | 'retired'
      allottedUserId?: string | null
    }) => {
      const parsedCost = finalCost ? parseFloat(finalCost) : null

      const { error: e1 } = await supabase
        .from('repair_records')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          final_cost_pkr: parsedCost,
          resolved_status: newStatus,
          actual_return_date: new Date().toISOString().slice(0, 10),
        })
        .eq('id', repairId)
      if (e1) throw e1

      const assetUpdate: Record<string, unknown> = {
        status: newStatus,
        allotted_user_id: newStatus === 'allotted' ? (allottedUserId ?? null) : null,
      }
      if (newStatus === 'retired') {
        assetUpdate.retirement_reason = 'beyond_repair'
      }

      const { error: e2 } = await supabase.from('assets').update(assetUpdate).eq('id', assetId)
      if (e2) throw e2

      await supabase.from('asset_audit_log').insert([
        {
          asset_id: assetId,
          action: 'repair_closed',
          actor_id: user!.id,
          after_state: { resolved_status: newStatus },
        },
        ...(newStatus === 'retired'
          ? [{ asset_id: assetId, action: 'retired' as const, actor_id: user!.id, after_state: { retirement_reason: 'beyond_repair' } }]
          : []),
      ])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repairs'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export function useUpdateRepair() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ repairId, values }: { repairId: string; values: import('@/lib/validations').RepairFormValues }) => {
      const { error } = await supabase
        .from('repair_records')
        .update({
          fault_description: values.fault_description,
          repair_vendor_name: values.repair_vendor_name,
          repair_vendor_phone: values.repair_vendor_phone,
          date_sent: values.date_sent,
          expected_return_date: values.expected_return_date,
          estimated_cost_pkr: values.estimated_cost_pkr ?? null,
        })
        .eq('id', repairId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['repairs'] }),
  })
}

export function useMarkRepairUnresponsive() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (repairId: string) => {
      const { error } = await supabase
        .from('repair_records')
        .update({ status: 'vendor_unresponsive' })
        .eq('id', repairId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['repairs'] }),
  })
}
