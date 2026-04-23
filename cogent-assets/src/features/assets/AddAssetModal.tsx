import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Building2, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { UserSelectDropdown } from '@/components/ui/UserSelectDropdown'
import { assetSchema, type AssetFormValues } from '@/lib/validations'
import { useCreateAsset } from '@/hooks/useAssets'
import { useUsers } from '@/hooks/useUsers'
import { supabase } from '@/lib/supabase'
import {
  ASSET_TYPE_LABELS, EMPLOYEE_ASSET_TYPES, COMPANY_ASSET_TYPES,
  PTA_STATUS_OPTIONS, STATUS_OPTIONS,
} from '@/lib/constants'
import type { Classification, AssetType } from '@/types'
import { cn } from '@/lib/utils'

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

interface AddAssetModalProps {
  open: boolean
  onClose: () => void
  defaultClassification?: Classification
  defaultType?: AssetType
}

export function AddAssetModal({ open, onClose, defaultClassification, defaultType }: AddAssetModalProps) {
  const [step, setStep] = useState<1 | 2>(defaultClassification ? 2 : 1)
  const [classification, setClassification] = useState<Classification | null>(defaultClassification ?? null)
  const [laptopConflict, setLaptopConflict] = useState<string | null>(null)
  const [tagError, setTagError] = useState<string | null>(null)
  const [serialError, setSerialError] = useState<string | null>(null)
  const { data: users } = useUsers({ status: 'active' })
  const createAsset = useCreateAsset()

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      classification: defaultClassification ?? 'employee_allocated',
      asset_type: defaultType ?? 'laptop',
      price_pkr: 0,
      vendor_name: '',
      vendor_phone: '',
      invoice_number: '',
      purchase_date: '',
      specs: '',
      status: 'available',
      manufacturer: '',
      asset_tag: '',
    },
  })

  const assetType = watch('asset_type')
  const selectedStatus = watch('status')
  const allottedUserId = watch('allotted_user_id')
  const assetTag = watch('asset_tag')
  const serialNumber = watch('serial_number')

  useEffect(() => { setTagError(null) }, [assetTag])
  useEffect(() => { setSerialError(null) }, [serialNumber])

  useEffect(() => {
    if (open) {
      const cls = defaultClassification ?? null
      setClassification(cls)
      setStep(cls ? 2 : 1)
      setLaptopConflict(null)
      setTagError(null)
      setSerialError(null)
      const types = cls === 'employee_allocated' ? EMPLOYEE_ASSET_TYPES : COMPANY_ASSET_TYPES
      const initialType = (defaultType ?? types[0]) as AssetType
      reset({
        classification: cls ?? 'employee_allocated',
        asset_type: initialType,
        price_pkr: 0,
        vendor_name: '',
        vendor_phone: '',
        invoice_number: '',
        purchase_date: '',
        specs: '',
        status: 'available',
        manufacturer: '',
        asset_tag: '',
      })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

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
      .limit(1)
      .then(({ data }) => {
        setLaptopConflict(data && data.length > 0 ? data[0].asset_tag : null)
      })
  }, [allottedUserId, assetType])

  function handleClassificationSelect(c: Classification) {
    setClassification(c)
    setValue('classification', c)
    const types = c === 'employee_allocated' ? EMPLOYEE_ASSET_TYPES : COMPANY_ASSET_TYPES
    setValue('asset_type', types[0] as AssetType)
    setStep(2)
  }

  const availableTypes = classification === 'employee_allocated' ? EMPLOYEE_ASSET_TYPES : COMPANY_ASSET_TYPES
  const typeOptions = availableTypes.map((t: string) => ({ value: t, label: ASSET_TYPE_LABELS[t] }))

  async function onSubmit(values: AssetFormValues) {
    if (laptopConflict) return

    // Prefix validation
    const prefix = TAG_PREFIXES[values.asset_type] ?? ''
    if (prefix && !values.asset_tag.startsWith(prefix)) {
      setTagError(`Tag for ${values.asset_type} must start with ${prefix} (e.g. ${prefix}0001)`)
      return
    }

    // Duplicate tag check
    const { data: tagExists } = await supabase
      .from('assets')
      .select('id')
      .eq('asset_tag', values.asset_tag)
      .maybeSingle()
    if (tagExists) {
      setTagError(`Tag ${values.asset_tag} already exists in the system`)
      return
    }

    // Duplicate serial number check (only if provided)
    const cleanedSerial = values.serial_number?.trim() || null
    if (cleanedSerial) {
      const { data: snExists } = await supabase
        .from('assets')
        .select('id')
        .eq('serial_number', cleanedSerial)
        .maybeSingle()
      if (snExists) {
        setSerialError('This serial number already exists on another asset')
        return
      }
    }

    if (values.status !== 'allotted') values.allotted_user_id = null

    try {
      await createAsset.mutateAsync({
        ...values,
        serial_number: cleanedSerial,
        purchase_date: values.purchase_date || null,
        created_by: '',
      } as Parameters<typeof createAsset.mutateAsync>[0])
      toast.success('Asset added successfully')
      handleClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add asset')
    }
  }

  function handleClose() {
    reset()
    setStep(defaultClassification ? 2 : 1)
    setClassification(defaultClassification ?? null)
    setLaptopConflict(null)
    setTagError(null)
    setSerialError(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 1 ? 'Add Asset — Choose Classification' : 'Add New Asset'}
      size="lg"
      footer={
        step === 2 ? (
          <>
            {!defaultClassification && (
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            )}
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSubmit(onSubmit)}
              loading={createAsset.isPending}
              disabled={!!laptopConflict}
            >
              Add Asset
            </Button>
          </>
        ) : undefined
      }
    >
      {step === 1 && (
        <div className="grid grid-cols-2 gap-4">
          {(
            [
              { value: 'employee_allocated', label: 'Employee Allocated', icon: User, desc: 'Laptops, mobiles, accessories' },
              { value: 'company_allocated', label: 'Company Allocated', icon: Building2, desc: 'Furniture, equipment, AV' },
            ] as const
          ).map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              onClick={() => handleClassificationSelect(value)}
              className={cn(
                'p-6 rounded-lg border-2 text-left transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]',
                classification === value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                  : 'border-[var(--color-border)]'
              )}
            >
              <Icon className="w-8 h-8 text-[var(--color-primary)] mb-3" />
              <p className="font-semibold text-[var(--color-primary)]">{label}</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">{desc}</p>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
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
            {defaultType ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)]">Asset Type</label>
                <div className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-medium text-[var(--color-text)]">
                  {ASSET_TYPE_LABELS[defaultType]}
                </div>
              </div>
            ) : (
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
            )}
          </div>

          <Input
            label="Manufacturer *"
            placeholder="e.g. Apple, Dell, HP, Lenovo, Samsung"
            {...register('manufacturer')}
            error={errors.manufacturer?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (PKR) *"
              type="number"
              min={0}
              {...register('price_pkr', { valueAsNumber: true })}
              error={errors.price_pkr?.message}
            />
            <Input
              label="Invoice Number"
              {...register('invoice_number')}
              error={errors.invoice_number?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Vendor Name" {...register('vendor_name')} error={errors.vendor_name?.message} />
            <Input label="Vendor Phone" {...register('vendor_phone')} error={errors.vendor_phone?.message} />
          </div>

          <Input
            label="Purchase Date"
            type="date"
            {...register('purchase_date')}
            error={errors.purchase_date?.message}
          />

          <Textarea
            label="Specs / Description *"
            rows={3}
            {...register('specs')}
            error={errors.specs?.message}
          />

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
                <Select
                  label="PTA Status *"
                  options={PTA_STATUS_OPTIONS}
                  value={field.value ?? 'unknown'}
                  onValueChange={field.onChange}
                  error={errors.pta_status?.message}
                />
              )}
            />
          )}

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Status *"
                options={STATUS_OPTIONS.filter((s) => s.value !== 'retired')}
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v)
                  if (v !== 'allotted') setValue('allotted_user_id', null)
                }}
                error={errors.status?.message}
              />
            )}
          />

          {selectedStatus === 'allotted' && classification === 'employee_allocated' && (
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

          {classification === 'company_allocated' && (
            <Input
              label="Location *"
              {...register('location')}
              error={errors.location?.message}
              placeholder="e.g. Office Floor 2, Meeting Room A"
            />
          )}
        </form>
      )}
    </Modal>
  )
}
