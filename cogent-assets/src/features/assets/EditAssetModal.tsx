import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { UserSelectDropdown } from '@/components/ui/UserSelectDropdown'
import { assetSchema, type AssetFormValues } from '@/lib/validations'
import { useUpdateAsset } from '@/hooks/useAssets'
import { useUsers } from '@/hooks/useUsers'
import { supabase } from '@/lib/supabase'
import {
  ASSET_TYPE_LABELS, EMPLOYEE_ASSET_TYPES, COMPANY_ASSET_TYPES,
  PTA_STATUS_OPTIONS, STATUS_OPTIONS, RETIREMENT_REASON_OPTIONS,
} from '@/lib/constants'
import type { Asset } from '@/types'

const TAG_PREFIXES: Record<string, string> = {
  laptop: 'LT-',
  mobile: 'MP-',
  monitor: 'CLED-',
  mouse: 'MSE-',
  keyboard: 'KB-',
  webcam: 'WC-',
  hub: 'HUB-',
  bag: 'BAG-',
  hdd: 'HDD-',
  chair: 'CHR-',
  desk: 'DSK-',
  projector: 'PRJ-',
  speaker: 'SPK-',
  camera: 'CAM-',
  ups: 'UPS-',
  whiteboard: 'WB-',
  other: '',
}

interface EditAssetModalProps {
  open: boolean
  onClose: () => void
  asset: Asset
}

export function EditAssetModal({ open, onClose, asset }: EditAssetModalProps) {
  const updateAsset = useUpdateAsset()
  const { data: users } = useUsers({ status: 'active' })
  const [laptopConflict, setLaptopConflict] = useState<string | null>(null)
  const [tagError, setTagError] = useState<string | null>(null)
  const [serialError, setSerialError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      asset_tag: asset.asset_tag,
      classification: asset.classification,
      asset_type: asset.asset_type,
      manufacturer: asset.manufacturer ?? '',
      price_pkr: asset.price_pkr,
      vendor_name: asset.vendor_name,
      vendor_phone: asset.vendor_phone,
      invoice_number: asset.invoice_number,
      purchase_date: asset.purchase_date ?? '',
      specs: asset.specs,
      serial_number: asset.serial_number ?? undefined,
      pta_status: asset.pta_status ?? undefined,
      allotted_user_id: asset.allotted_user_id ?? undefined,
      location: asset.location ?? undefined,
      status: asset.status,
      retirement_reason: asset.retirement_reason ?? undefined,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        asset_tag: asset.asset_tag,
        classification: asset.classification,
        asset_type: asset.asset_type,
        manufacturer: asset.manufacturer ?? '',
        price_pkr: asset.price_pkr,
        vendor_name: asset.vendor_name,
        vendor_phone: asset.vendor_phone,
        invoice_number: asset.invoice_number,
        purchase_date: asset.purchase_date ?? '',
        specs: asset.specs,
        serial_number: asset.serial_number ?? undefined,
        pta_status: asset.pta_status ?? undefined,
        allotted_user_id: asset.allotted_user_id ?? undefined,
        location: asset.location ?? undefined,
        status: asset.status,
        retirement_reason: asset.retirement_reason ?? undefined,
      })
      setLaptopConflict(null)
      setTagError(null)
      setSerialError(null)
    }
  }, [open, asset, reset])

  const assetType = watch('asset_type')
  const selectedStatus = watch('status')
  const allottedUserId = watch('allotted_user_id')
  const assetTag = watch('asset_tag')
  const serialNumber = watch('serial_number')

  useEffect(() => { setTagError(null) }, [assetTag])
  useEffect(() => { setSerialError(null) }, [serialNumber])

  useEffect(() => {
    if (assetType !== 'laptop' || !allottedUserId) {
      setLaptopConflict(null)
      return
    }
    supabase
      .from('assets')
      .select('asset_tag')
      .eq('asset_type', 'laptop')
      .eq('allotted_user_id', allottedUserId)
      .eq('status', 'allotted')
      .neq('id', asset.id)
      .limit(1)
      .then(({ data }) => {
        setLaptopConflict(data && data.length > 0 ? data[0].asset_tag : null)
      })
  }, [allottedUserId, assetType, asset.id])

  const availableTypes =
    asset.classification === 'employee_allocated' ? EMPLOYEE_ASSET_TYPES : COMPANY_ASSET_TYPES
  const typeOptions = availableTypes.map((t: string) => ({ value: t, label: ASSET_TYPE_LABELS[t] }))

  async function onSubmit(values: AssetFormValues) {
    if (laptopConflict) return

    // Prefix validation
    const prefix = TAG_PREFIXES[values.asset_type] ?? ''
    if (prefix && !values.asset_tag.startsWith(prefix)) {
      setTagError(`Tag for ${values.asset_type} must start with ${prefix} (e.g. ${prefix}0001)`)
      return
    }

    // Duplicate tag check (exclude current asset)
    const { data: tagExists } = await supabase
      .from('assets')
      .select('id')
      .eq('asset_tag', values.asset_tag)
      .neq('id', asset.id)
      .maybeSingle()
    if (tagExists) {
      setTagError(`Tag ${values.asset_tag} already exists in the system`)
      return
    }

    // Duplicate serial number check (exclude current asset, only if provided)
    const cleanedSerial = values.serial_number?.trim() || null
    if (cleanedSerial) {
      const { data: snExists } = await supabase
        .from('assets')
        .select('id')
        .eq('serial_number', cleanedSerial)
        .neq('id', asset.id)
        .maybeSingle()
      if (snExists) {
        setSerialError('This serial number already exists on another asset')
        return
      }
    }

    if (values.status !== 'allotted') values.allotted_user_id = null

    try {
      await updateAsset.mutateAsync({
        id: asset.id,
        before: asset,
        updates: {
          ...values,
          serial_number: cleanedSerial,
          purchase_date: values.purchase_date || null,
        },
      })
      toast.success('Asset updated')
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update asset')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Asset — ${asset.asset_tag}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={updateAsset.isPending}
            disabled={!!laptopConflict}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Asset Tag *"
              placeholder="e.g. LT-0081"
              {...register('asset_tag')}
              error={errors.asset_tag?.message}
            />
            {tagError && (
              <p className="mt-1 text-xs text-[var(--color-danger)] font-medium">{tagError}</p>
            )}
          </div>
          <Controller
            name="asset_type"
            control={control}
            render={({ field }) => (
              <Select
                label="Asset Type *"
                options={typeOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.asset_type?.message}
              />
            )}
          />
        </div>

        <Input
          label="Manufacturer *"
          placeholder="e.g. Apple, Dell, HP, Lenovo, Samsung"
          {...register('manufacturer')}
          error={errors.manufacturer?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Price (PKR) *" type="number" min={0} {...register('price_pkr', { valueAsNumber: true })} error={errors.price_pkr?.message} />
          <Input label="Invoice Number" {...register('invoice_number')} error={errors.invoice_number?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Vendor Name" {...register('vendor_name')} error={errors.vendor_name?.message} />
          <Input label="Vendor Phone" {...register('vendor_phone')} error={errors.vendor_phone?.message} />
        </div>

        <Input label="Purchase Date" type="date" {...register('purchase_date')} error={errors.purchase_date?.message} />

        <Textarea label="Specs / Description *" rows={3} {...register('specs')} error={errors.specs?.message} />

        {!['mouse', 'keyboard', 'bag', 'other'].includes(assetType) && (
          <div>
            <Input
              label={assetType === 'mobile' ? 'IMEI Number' : 'Serial Number'}
              placeholder={assetType === 'mobile' ? 'e.g. 867034051060102' : undefined}
              {...register('serial_number')}
              error={errors.serial_number?.message}
            />
            {serialError && (
              <p className="mt-1 text-xs text-[var(--color-danger)] font-medium">{serialError}</p>
            )}
          </div>
        )}

        {assetType === 'mobile' && (
          <Controller
            name="pta_status"
            control={control}
            render={({ field }) => (
              <Select label="PTA Status *" options={PTA_STATUS_OPTIONS} value={field.value ?? 'unknown'} onValueChange={field.onChange} error={errors.pta_status?.message} />
            )}
          />
        )}

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              label="Status *"
              options={STATUS_OPTIONS.filter((s) => s.value !== 'in_repair')}
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v)
                if (v !== 'allotted') setValue('allotted_user_id', null)
              }}
              error={errors.status?.message}
            />
          )}
        />

        {selectedStatus === 'retired' && (
          <Controller
            name="retirement_reason"
            control={control}
            render={({ field }) => (
              <Select label="Retirement Reason *" options={RETIREMENT_REASON_OPTIONS} value={field.value ?? 'end_of_life'} onValueChange={field.onChange} error={errors.retirement_reason?.message} />
            )}
          />
        )}

        {selectedStatus === 'allotted' && asset.classification === 'employee_allocated' && (
          <>
            <UserSelectDropdown
              label="Allotted To *"
              profiles={users ?? []}
              value={allottedUserId ?? ''}
              onSelect={(uid) => setValue('allotted_user_id', uid || null)}
              error={errors.allotted_user_id?.message}
            />
            {laptopConflict && (
              <p className="text-xs text-[var(--color-danger)] font-medium">
                This employee already has a laptop assigned ({laptopConflict}). Return that laptop before assigning a new one.
              </p>
            )}
          </>
        )}

        {asset.classification === 'company_allocated' && (
          <Input label="Location *" {...register('location')} error={errors.location?.message} />
        )}
      </form>
    </Modal>
  )
}
