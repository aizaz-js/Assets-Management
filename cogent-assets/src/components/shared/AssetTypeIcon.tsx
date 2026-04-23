import {
  Laptop, Smartphone, Monitor, Mouse, Keyboard, Camera,
  HardDrive, Briefcase, Armchair, Table2, Projector,
  Speaker, Video, Zap, PanelTop, Database, Package,
} from 'lucide-react'
import type { AssetType } from '@/types'
import { cn } from '@/lib/utils'

const iconMap: Record<AssetType, React.ElementType> = {
  laptop: Laptop,
  mobile: Smartphone,
  monitor: Monitor,
  mouse: Mouse,
  keyboard: Keyboard,
  webcam: Camera,
  hub: HardDrive,
  bag: Briefcase,
  chair: Armchair,
  desk: Table2,
  projector: Projector,
  speaker: Speaker,
  camera: Video,
  ups: Zap,
  whiteboard: PanelTop,
  hdd: Database,
  other: Package,
}

interface AssetTypeIconProps {
  type: AssetType
  className?: string
  size?: number
}

export function AssetTypeIcon({ type, className, size = 20 }: AssetTypeIconProps) {
  const Icon = iconMap[type] ?? Package
  return <Icon size={size} className={cn('text-[var(--color-primary)]', className)} />
}
