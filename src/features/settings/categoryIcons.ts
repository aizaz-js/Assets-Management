import {
  // Computing & displays
  Laptop, Monitor, Tv, MonitorPlay, MonitorSmartphone, MonitorSpeaker,
  Server, ServerCog, Cpu, CircuitBoard, MemoryStick, HardDrive,
  HardDriveDownload, HardDriveUpload, Database,
  // Mobile & wearables
  Smartphone, Phone, Tablet, Watch,
  // Peripherals
  MousePointer, Keyboard, Headphones, Headset, Speaker,
  Mic, Mic2, Webcam, Camera, Video, Projector, Printer,
  ScanLine, Scan,
  // Networking & power
  Wifi, Router, RadioTower, Bluetooth, Cable, Usb, Plug, Power, PowerOff,
  Zap, ZapOff, Battery, BatteryCharging, BatteryFull, BatteryLow, BatteryWarning,
  // Storage / media
  Disc, Disc3,
  Volume, Volume1, Volume2, VolumeX,
  Play, PlayCircle, Pause, PauseCircle, SkipForward, SkipBack,
  Music, Music2, Film, Aperture, Image, ScreenShare, Cast, Airplay,
  // Gaming
  Gamepad, Gamepad2, Joystick,
  // Furniture & lighting
  Armchair, Sofa, Bed, Lamp, LampDesk, LampFloor, LampCeiling,
  Lightbulb, Layout,
  // Office & stationery
  Briefcase, Folder, FolderOpen, FileText, Files, Paperclip,
  Book, BookOpen, Bookmark,
  Pen, PenLine, PenTool, Pencil, PencilLine, PencilRuler, Edit, Edit3,
  Scissors, Ruler, Calculator, Clipboard, ClipboardCheck,
  Receipt, ReceiptText,
  // Kitchen / pantry
  Coffee, Utensils, UtensilsCrossed, Refrigerator, Microwave,
  Salad, Pizza, Apple, Banana, Wine,
  // Climate & weather
  Fan, AirVent, Thermometer, Sun, Moon, Cloud, CloudSun, CloudUpload, CloudDownload,
  // Vehicles
  Car, Bike, Truck, Bus, Plane, Train, Ship,
  // Security & alerts
  Lock, Key, KeyRound, Fingerprint, Shield, Cctv, Eye,
  Bell, BellRing, Siren, AlertTriangle, AlertCircle,
  // Tools
  Wrench, Hammer, Drill, Cog, Settings, Gauge, HardHat,
  // Decoration / awards
  Star, Heart, Award, Trophy, Medal, Flag, Gift, PartyPopper, Cake, Smile, ThumbsUp,
  // People & places
  Users, User, UserCog, Contact,
  Building, Building2, Home, Store, Warehouse, Factory,
  Mailbox, Mail, Inbox, Send, MessageSquare, MessageCircle,
  // Maps
  Globe, Map, MapPin, Compass, Anchor,
  // Nature / animals
  Leaf, Trees, TreePine, Flower, Flower2, Mountain, Waves,
  Dog, Cat, Fish, Bird,
  // Healthcare
  Beaker, FlaskConical, TestTube, Stethoscope, Syringe, Pill,
  // Commerce / time
  ShoppingBag, ShoppingCart, CreditCard, Wallet, Banknote,
  Calendar, Clock, Timer, AlarmClock,
  // Storage / boxes
  Package, Box, Boxes, Container, Archive, Trash, Trash2, Recycle,
  // Layout & system
  LayoutDashboard, LayoutList, LayoutPanelLeft,
  PanelTop, PanelLeft, PanelRight, PanelBottom,
  Tag, Info, HelpCircle,
  List, ListOrdered, ListChecks, CheckSquare, Square,
  GitBranch, GitMerge, GitPullRequest,
  Palette, Brush, PaintBucket, PaintRoller,
  type LucideIcon,
} from 'lucide-react'

export interface IconOption {
  name: string
  icon: LucideIcon
  keywords?: string
}

export const CATEGORY_ICON_OPTIONS: IconOption[] = [
  // Computing
  { name: 'Laptop', icon: Laptop, keywords: 'computer notebook macbook' },
  { name: 'Monitor', icon: Monitor, keywords: 'screen display lcd led' },
  { name: 'Tv', icon: Tv, keywords: 'television smart led' },
  { name: 'MonitorPlay', icon: MonitorPlay, keywords: 'screen display media' },
  { name: 'MonitorSmartphone', icon: MonitorSmartphone, keywords: 'screen mobile' },
  { name: 'MonitorSpeaker', icon: MonitorSpeaker, keywords: 'screen audio' },
  { name: 'Server', icon: Server, keywords: 'rack hosting nas' },
  { name: 'ServerCog', icon: ServerCog, keywords: 'rack settings' },
  { name: 'Cpu', icon: Cpu, keywords: 'processor chip' },
  { name: 'CircuitBoard', icon: CircuitBoard, keywords: 'electronics chip pcb' },
  { name: 'MemoryStick', icon: MemoryStick, keywords: 'ram dimm memory' },
  { name: 'HardDrive', icon: HardDrive, keywords: 'hdd ssd storage disk' },
  { name: 'HardDriveDownload', icon: HardDriveDownload, keywords: 'hdd ssd backup' },
  { name: 'HardDriveUpload', icon: HardDriveUpload, keywords: 'hdd ssd backup' },
  { name: 'Database', icon: Database, keywords: 'storage db' },

  // Mobile & wearables
  { name: 'Smartphone', icon: Smartphone, keywords: 'mobile phone iphone android' },
  { name: 'Phone', icon: Phone, keywords: 'telephone landline' },
  { name: 'Tablet', icon: Tablet, keywords: 'ipad' },
  { name: 'Watch', icon: Watch, keywords: 'wearable smartwatch' },

  // Peripherals
  { name: 'Mouse', icon: MousePointer, keywords: 'cursor pointer' },
  { name: 'Keyboard', icon: Keyboard, keywords: 'typing keys' },
  { name: 'Headphones', icon: Headphones, keywords: 'audio headset' },
  { name: 'Headset', icon: Headset, keywords: 'audio call gaming' },
  { name: 'Speaker', icon: Speaker, keywords: 'audio sound' },
  { name: 'Microphone', icon: Mic, keywords: 'mic audio recording' },
  { name: 'Microphone2', icon: Mic2, keywords: 'mic studio' },
  { name: 'Webcam', icon: Webcam, keywords: 'camera video conferencing' },
  { name: 'Camera', icon: Camera, keywords: 'photo dslr' },
  { name: 'Video', icon: Video, keywords: 'camcorder recording' },
  { name: 'Projector', icon: Projector, keywords: 'beamer presentation' },
  { name: 'Printer', icon: Printer, keywords: 'print laser inkjet' },
  { name: 'Scanner', icon: ScanLine, keywords: 'scan barcode' },
  { name: 'Scan', icon: Scan, keywords: 'qr scan' },

  // Networking & power
  { name: 'Wifi', icon: Wifi, keywords: 'wireless network' },
  { name: 'Router', icon: Router, keywords: 'network wifi' },
  { name: 'RadioTower', icon: RadioTower, keywords: 'antenna signal' },
  { name: 'Bluetooth', icon: Bluetooth, keywords: 'wireless' },
  { name: 'Cable', icon: Cable, keywords: 'cord wire' },
  { name: 'Usb', icon: Usb, keywords: 'cable port' },
  { name: 'Plug', icon: Plug, keywords: 'power outlet' },
  { name: 'Power', icon: Power, keywords: 'on off button' },
  { name: 'PowerOff', icon: PowerOff, keywords: 'shutdown' },
  { name: 'Zap', icon: Zap, keywords: 'electricity power lightning' },
  { name: 'ZapOff', icon: ZapOff, keywords: 'electricity off' },
  { name: 'Battery', icon: Battery, keywords: 'power' },
  { name: 'BatteryCharging', icon: BatteryCharging, keywords: 'power charge' },
  { name: 'BatteryFull', icon: BatteryFull, keywords: 'power full' },
  { name: 'BatteryLow', icon: BatteryLow, keywords: 'power low' },
  { name: 'BatteryWarning', icon: BatteryWarning, keywords: 'power warning' },

  // Storage / discs
  { name: 'Disc', icon: Disc, keywords: 'cd dvd blu-ray' },
  { name: 'Disc3', icon: Disc3, keywords: 'cd dvd blu-ray' },

  // Audio / Video
  { name: 'Volume', icon: Volume, keywords: 'sound audio' },
  { name: 'Volume1', icon: Volume1, keywords: 'sound audio low' },
  { name: 'Volume2', icon: Volume2, keywords: 'sound audio high' },
  { name: 'VolumeX', icon: VolumeX, keywords: 'sound mute' },
  { name: 'Play', icon: Play, keywords: 'media' },
  { name: 'PlayCircle', icon: PlayCircle, keywords: 'media' },
  { name: 'Pause', icon: Pause, keywords: 'media' },
  { name: 'PauseCircle', icon: PauseCircle, keywords: 'media' },
  { name: 'SkipForward', icon: SkipForward, keywords: 'media next' },
  { name: 'SkipBack', icon: SkipBack, keywords: 'media previous' },
  { name: 'Music', icon: Music, keywords: 'note song' },
  { name: 'Music2', icon: Music2, keywords: 'note song' },
  { name: 'Film', icon: Film, keywords: 'movie video' },
  { name: 'Aperture', icon: Aperture, keywords: 'camera lens' },
  { name: 'Image', icon: Image, keywords: 'photo picture' },
  { name: 'ScreenShare', icon: ScreenShare, keywords: 'cast presentation' },
  { name: 'Cast', icon: Cast, keywords: 'wireless display' },
  { name: 'Airplay', icon: Airplay, keywords: 'apple cast' },

  // Gaming
  { name: 'Gamepad', icon: Gamepad, keywords: 'controller console' },
  { name: 'Gamepad2', icon: Gamepad2, keywords: 'controller xbox playstation' },
  { name: 'Joystick', icon: Joystick, keywords: 'arcade controller' },

  // Furniture & lighting
  { name: 'Chair', icon: Armchair, keywords: 'seat office armchair' },
  { name: 'Sofa', icon: Sofa, keywords: 'couch seat' },
  { name: 'Bed', icon: Bed, keywords: 'mattress sleep' },
  { name: 'Lamp', icon: Lamp, keywords: 'light' },
  { name: 'LampDesk', icon: LampDesk, keywords: 'light table' },
  { name: 'LampFloor', icon: LampFloor, keywords: 'light standing' },
  { name: 'LampCeiling', icon: LampCeiling, keywords: 'light overhead' },
  { name: 'Lightbulb', icon: Lightbulb, keywords: 'idea light' },
  { name: 'Layout', icon: Layout, keywords: 'desk workspace' },

  // Office & stationery
  { name: 'Briefcase', icon: Briefcase, keywords: 'bag work' },
  { name: 'Folder', icon: Folder, keywords: 'files documents' },
  { name: 'FolderOpen', icon: FolderOpen, keywords: 'files documents' },
  { name: 'FileText', icon: FileText, keywords: 'document' },
  { name: 'Files', icon: Files, keywords: 'documents' },
  { name: 'Paperclip', icon: Paperclip, keywords: 'attach' },
  { name: 'Book', icon: Book, keywords: 'reading' },
  { name: 'BookOpen', icon: BookOpen, keywords: 'reading' },
  { name: 'Bookmark', icon: Bookmark, keywords: 'save' },
  { name: 'Pen', icon: Pen, keywords: 'write' },
  { name: 'PenLine', icon: PenLine, keywords: 'write sign' },
  { name: 'PenTool', icon: PenTool, keywords: 'design draw' },
  { name: 'Pencil', icon: Pencil, keywords: 'write' },
  { name: 'PencilLine', icon: PencilLine, keywords: 'write' },
  { name: 'PencilRuler', icon: PencilRuler, keywords: 'design measure' },
  { name: 'Edit', icon: Edit, keywords: 'modify' },
  { name: 'Edit3', icon: Edit3, keywords: 'pen write' },
  { name: 'Scissors', icon: Scissors, keywords: 'cut' },
  { name: 'Ruler', icon: Ruler, keywords: 'measure' },
  { name: 'Calculator', icon: Calculator, keywords: 'math' },
  { name: 'Clipboard', icon: Clipboard, keywords: 'document list' },
  { name: 'ClipboardCheck', icon: ClipboardCheck, keywords: 'document approved' },
  { name: 'Receipt', icon: Receipt, keywords: 'invoice bill' },
  { name: 'ReceiptText', icon: ReceiptText, keywords: 'invoice bill' },

  // Kitchen / pantry
  { name: 'Coffee', icon: Coffee, keywords: 'mug cafe' },
  { name: 'Utensils', icon: Utensils, keywords: 'fork knife eat' },
  { name: 'UtensilsCrossed', icon: UtensilsCrossed, keywords: 'fork knife' },
  { name: 'Refrigerator', icon: Refrigerator, keywords: 'fridge appliance' },
  { name: 'Microwave', icon: Microwave, keywords: 'oven appliance' },
  { name: 'Salad', icon: Salad, keywords: 'food meal' },
  { name: 'Pizza', icon: Pizza, keywords: 'food meal' },
  { name: 'Apple', icon: Apple, keywords: 'fruit' },
  { name: 'Banana', icon: Banana, keywords: 'fruit' },
  { name: 'Wine', icon: Wine, keywords: 'drink alcohol' },

  // Climate & weather
  { name: 'Fan', icon: Fan, keywords: 'cooling air' },
  { name: 'AirVent', icon: AirVent, keywords: 'ac air conditioning' },
  { name: 'Thermometer', icon: Thermometer, keywords: 'temperature heat' },
  { name: 'Sun', icon: Sun, keywords: 'light bright' },
  { name: 'Moon', icon: Moon, keywords: 'night dark' },
  { name: 'Cloud', icon: Cloud, keywords: 'weather' },
  { name: 'CloudSun', icon: CloudSun, keywords: 'weather' },
  { name: 'CloudUpload', icon: CloudUpload, keywords: 'storage backup' },
  { name: 'CloudDownload', icon: CloudDownload, keywords: 'storage backup' },

  // Vehicles
  { name: 'Car', icon: Car, keywords: 'vehicle auto' },
  { name: 'Bike', icon: Bike, keywords: 'cycle bicycle' },
  { name: 'Truck', icon: Truck, keywords: 'lorry delivery' },
  { name: 'Bus', icon: Bus, keywords: 'transport' },
  { name: 'Plane', icon: Plane, keywords: 'flight travel' },
  { name: 'Train', icon: Train, keywords: 'rail' },
  { name: 'Ship', icon: Ship, keywords: 'boat sea' },

  // Security & alerts
  { name: 'Lock', icon: Lock, keywords: 'security padlock' },
  { name: 'Key', icon: Key, keywords: 'access' },
  { name: 'KeyRound', icon: KeyRound, keywords: 'access' },
  { name: 'Fingerprint', icon: Fingerprint, keywords: 'biometric access' },
  { name: 'Shield', icon: Shield, keywords: 'security protect' },
  { name: 'Cctv', icon: Cctv, keywords: 'surveillance camera security' },
  { name: 'Eye', icon: Eye, keywords: 'visibility view' },
  { name: 'Bell', icon: Bell, keywords: 'alert notification' },
  { name: 'BellRing', icon: BellRing, keywords: 'alarm alert' },
  { name: 'Siren', icon: Siren, keywords: 'emergency alarm' },
  { name: 'AlertTriangle', icon: AlertTriangle, keywords: 'warning' },
  { name: 'AlertCircle', icon: AlertCircle, keywords: 'warning' },

  // Tools & maintenance
  { name: 'Wrench', icon: Wrench, keywords: 'spanner repair' },
  { name: 'Hammer', icon: Hammer, keywords: 'tool' },
  { name: 'Drill', icon: Drill, keywords: 'tool' },
  { name: 'Cog', icon: Cog, keywords: 'gear settings' },
  { name: 'Settings', icon: Settings, keywords: 'gear preferences' },
  { name: 'Gauge', icon: Gauge, keywords: 'speedometer measure' },
  { name: 'HardHat', icon: HardHat, keywords: 'helmet construction' },

  // Decoration / awards
  { name: 'Star', icon: Star, keywords: 'favorite rating' },
  { name: 'Heart', icon: Heart, keywords: 'love favorite' },
  { name: 'Award', icon: Award, keywords: 'badge prize' },
  { name: 'Trophy', icon: Trophy, keywords: 'prize win' },
  { name: 'Medal', icon: Medal, keywords: 'prize award' },
  { name: 'Flag', icon: Flag, keywords: 'mark country' },
  { name: 'Gift', icon: Gift, keywords: 'present' },
  { name: 'PartyPopper', icon: PartyPopper, keywords: 'celebrate event' },
  { name: 'Cake', icon: Cake, keywords: 'birthday' },
  { name: 'Smile', icon: Smile, keywords: 'happy face' },
  { name: 'ThumbsUp', icon: ThumbsUp, keywords: 'approve like' },

  // People
  { name: 'Users', icon: Users, keywords: 'team people' },
  { name: 'User', icon: User, keywords: 'person' },
  { name: 'UserCog', icon: UserCog, keywords: 'admin' },
  { name: 'Contact', icon: Contact, keywords: 'address book' },

  // Buildings & places
  { name: 'Building', icon: Building, keywords: 'office company' },
  { name: 'Building2', icon: Building2, keywords: 'office company' },
  { name: 'Home', icon: Home, keywords: 'house' },
  { name: 'Store', icon: Store, keywords: 'shop' },
  { name: 'Warehouse', icon: Warehouse, keywords: 'storage' },
  { name: 'Factory', icon: Factory, keywords: 'manufacturing' },
  { name: 'Mailbox', icon: Mailbox, keywords: 'post mail' },
  { name: 'Mail', icon: Mail, keywords: 'email letter' },
  { name: 'Inbox', icon: Inbox, keywords: 'email tray' },
  { name: 'Send', icon: Send, keywords: 'message email' },
  { name: 'MessageSquare', icon: MessageSquare, keywords: 'chat' },
  { name: 'MessageCircle', icon: MessageCircle, keywords: 'chat' },

  // Maps / location
  { name: 'Globe', icon: Globe, keywords: 'world earth' },
  { name: 'Map', icon: Map, keywords: 'location' },
  { name: 'MapPin', icon: MapPin, keywords: 'location pin' },
  { name: 'Compass', icon: Compass, keywords: 'navigation direction' },
  { name: 'Anchor', icon: Anchor, keywords: 'naval' },

  // Nature
  { name: 'Leaf', icon: Leaf, keywords: 'plant nature' },
  { name: 'Trees', icon: Trees, keywords: 'forest nature' },
  { name: 'TreePine', icon: TreePine, keywords: 'pine tree' },
  { name: 'Flower', icon: Flower, keywords: 'plant' },
  { name: 'Flower2', icon: Flower2, keywords: 'plant' },
  { name: 'Mountain', icon: Mountain, keywords: 'nature' },
  { name: 'Waves', icon: Waves, keywords: 'water sea' },

  // Animals
  { name: 'Dog', icon: Dog, keywords: 'pet' },
  { name: 'Cat', icon: Cat, keywords: 'pet' },
  { name: 'Fish', icon: Fish, keywords: 'pet aquarium' },
  { name: 'Bird', icon: Bird, keywords: 'pet' },

  // Healthcare
  { name: 'Beaker', icon: Beaker, keywords: 'lab science' },
  { name: 'FlaskConical', icon: FlaskConical, keywords: 'lab science' },
  { name: 'TestTube', icon: TestTube, keywords: 'lab science' },
  { name: 'Stethoscope', icon: Stethoscope, keywords: 'doctor medical' },
  { name: 'Syringe', icon: Syringe, keywords: 'medical injection' },
  { name: 'Pill', icon: Pill, keywords: 'medicine medical' },

  // Commerce
  { name: 'ShoppingBag', icon: ShoppingBag, keywords: 'shop' },
  { name: 'ShoppingCart', icon: ShoppingCart, keywords: 'shop' },
  { name: 'CreditCard', icon: CreditCard, keywords: 'payment' },
  { name: 'Wallet', icon: Wallet, keywords: 'money' },
  { name: 'Banknote', icon: Banknote, keywords: 'money cash' },

  // Time
  { name: 'Calendar', icon: Calendar, keywords: 'date' },
  { name: 'Clock', icon: Clock, keywords: 'time' },
  { name: 'Timer', icon: Timer, keywords: 'time stopwatch' },
  { name: 'AlarmClock', icon: AlarmClock, keywords: 'time alarm' },

  // Storage / boxes
  { name: 'Package', icon: Package, keywords: 'box parcel' },
  { name: 'Box', icon: Box, keywords: 'storage' },
  { name: 'Boxes', icon: Boxes, keywords: 'storage' },
  { name: 'Container', icon: Container, keywords: 'storage' },
  { name: 'Archive', icon: Archive, keywords: 'storage box' },
  { name: 'Trash', icon: Trash, keywords: 'bin garbage' },
  { name: 'Trash2', icon: Trash2, keywords: 'bin garbage' },
  { name: 'Recycle', icon: Recycle, keywords: 'reuse' },

  // Layout / dashboard
  { name: 'LayoutDashboard', icon: LayoutDashboard, keywords: 'dashboard panel' },
  { name: 'LayoutList', icon: LayoutList, keywords: 'list panel' },
  { name: 'LayoutPanelLeft', icon: LayoutPanelLeft, keywords: 'panel' },
  { name: 'PanelTop', icon: PanelTop, keywords: 'panel' },
  { name: 'PanelLeft', icon: PanelLeft, keywords: 'panel' },
  { name: 'PanelRight', icon: PanelRight, keywords: 'panel' },
  { name: 'PanelBottom', icon: PanelBottom, keywords: 'panel' },

  // Misc system
  { name: 'Tag', icon: Tag, keywords: 'label' },
  { name: 'Info', icon: Info, keywords: 'help' },
  { name: 'HelpCircle', icon: HelpCircle, keywords: 'help question' },
  { name: 'List', icon: List, keywords: 'items' },
  { name: 'ListOrdered', icon: ListOrdered, keywords: 'items numbered' },
  { name: 'ListChecks', icon: ListChecks, keywords: 'todo checklist' },
  { name: 'CheckSquare', icon: CheckSquare, keywords: 'done complete' },
  { name: 'Square', icon: Square, keywords: 'shape' },
  { name: 'GitBranch', icon: GitBranch, keywords: 'version' },
  { name: 'GitMerge', icon: GitMerge, keywords: 'version' },
  { name: 'GitPullRequest', icon: GitPullRequest, keywords: 'version pr' },
  { name: 'Palette', icon: Palette, keywords: 'colors design' },
  { name: 'Brush', icon: Brush, keywords: 'paint design' },
  { name: 'PaintBucket', icon: PaintBucket, keywords: 'paint fill' },
  { name: 'PaintRoller', icon: PaintRoller, keywords: 'paint' },
]

export function getCategoryIcon(iconName: string | undefined): LucideIcon {
  if (!iconName) return Package
  const found = CATEGORY_ICON_OPTIONS.find((opt) => opt.name === iconName)
  if (found) return found.icon
  return Package
}
