// Comprehensive list of Lucide icons (v0.263.1+)
// This list includes 500+ most commonly used icons
// Source: https://lucide.dev/icons/
export const LUCIDE_ICON_NAMES = [
  // Navigation & Arrows
  'ArrowDown', 'ArrowDownCircle', 'ArrowDownLeft', 'ArrowDownRight', 'ArrowLeft', 'ArrowLeftCircle',
  'ArrowRight', 'ArrowRightCircle', 'ArrowUp', 'ArrowUpCircle', 'ArrowUpLeft', 'ArrowUpRight',
  'ChevronDown', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronsDown', 'ChevronsLeft',
  'ChevronsRight', 'ChevronsUp', 'ChevronsUpDown', 'CornerDownLeft', 'CornerDownRight', 'CornerLeftDown',
  'CornerLeftUp', 'CornerRightDown', 'CornerRightUp', 'CornerUpLeft', 'CornerUpRight',

  // Basic Actions
  'Plus', 'PlusCircle', 'PlusSquare', 'Minus', 'MinusCircle', 'MinusSquare', 'X', 'XCircle', 'XSquare',
  'Check', 'CheckCircle', 'CheckCircle2', 'CheckSquare', 'Copy', 'CopyCheck', 'CopyMinus', 'CopyPlus',
  'Clipboard', 'ClipboardCheck', 'ClipboardCopy', 'ClipboardList', 'ClipboardPaste', 'ClipboardType',
  'Edit', 'Edit2', 'Edit3', 'Delete', 'Trash', 'Trash2', 'Save', 'Download', 'Upload', 'DownloadCloud',
  'UploadCloud', 'Share', 'Share2', 'Send', 'SendHorizontal',

  // Alerts & Status
  'AlertCircle', 'AlertOctagon', 'AlertTriangle', 'Info', 'HelpCircle', 'CheckCircle', 'XCircle',
  'ShieldAlert', 'ShieldCheck', 'ShieldClose', 'ShieldOff', 'Shield',

  // UI Elements
  'Menu', 'MoreHorizontal', 'MoreVertical', 'Maximize', 'Maximize2', 'Minimize', 'Minimize2',
  'Sidebar', 'PanelLeft', 'PanelRight', 'PanelTop', 'PanelBottom', 'Columns', 'Rows', 'Layout',
  'LayoutDashboard', 'LayoutGrid', 'LayoutList', 'LayoutTemplate', 'Grid', 'Grid3x3', 'List',
  'ListChecks', 'ListMinus', 'ListPlus', 'ListTodo', 'Layers', 'Layers2', 'Layers3',

  // Files & Folders
  'File', 'FileArchive', 'FileAudio', 'FileAudio2', 'FileAxis3d', 'FileBarChart', 'FileBarChart2',
  'FileBox', 'FileCheck', 'FileCheck2', 'FileClock', 'FileCode', 'FileCode2', 'FileCog', 'FileDiff',
  'FileDigit', 'FileDown', 'FileEdit', 'FileHeart', 'FileImage', 'FileInput', 'FileJson', 'FileJson2',
  'FileKey', 'FileKey2', 'FileLineChart', 'FileLock', 'FileLock2', 'FileMinus', 'FileMinus2',
  'FileMusic', 'FileOutput', 'FilePieChart', 'FilePlus', 'FilePlus2', 'FileQuestion', 'FileScan',
  'FileSearch', 'FileSearch2', 'FileSignature', 'FileSpreadsheet', 'FileStack', 'FileSymlink',
  'FileTerminal', 'FileText', 'FileType', 'FileType2', 'FileUp', 'FileVideo', 'FileVideo2',
  'FileVolume', 'FileVolume2', 'FileWarning', 'FileX', 'FileX2', 'Files',
  'Folder', 'FolderArchive', 'FolderCheck', 'FolderClock', 'FolderClosed', 'FolderCog', 'FolderDot',
  'FolderDown', 'FolderEdit', 'FolderGit', 'FolderGit2', 'FolderHeart', 'FolderInput', 'FolderKanban',
  'FolderKey', 'FolderLock', 'FolderMinus', 'FolderOpen', 'FolderOpenDot', 'FolderOutput', 'FolderPlus',
  'FolderRoot', 'FolderSearch', 'FolderSearch2', 'FolderSymlink', 'FolderTree', 'FolderUp', 'FolderX',
  'Folders',

  // Media & Images
  'Image', 'ImageDown', 'ImageMinus', 'ImageOff', 'ImagePlus', 'Video', 'VideoOff', 'Film', 'Camera',
  'CameraOff', 'Music', 'Music2', 'Music3', 'Music4', 'Play', 'PlayCircle', 'Pause', 'PauseCircle',
  'StopCircle', 'SkipBack', 'SkipForward', 'FastForward', 'Rewind', 'Volume', 'Volume1', 'Volume2',
  'VolumeX', 'Mic', 'MicOff', 'Radio', 'Disc', 'Disc2', 'Disc3', 'Speaker', 'Headphones', 'Podcast',

  // Communication
  'Mail', 'MailCheck', 'MailMinus', 'MailOpen', 'MailPlus', 'MailQuestion', 'MailSearch', 'MailWarning',
  'MailX', 'Inbox', 'MessageCircle', 'MessageSquare', 'MessageSquarePlus', 'Phone', 'PhoneCall',
  'PhoneForwarded', 'PhoneIncoming', 'PhoneMissed', 'PhoneOff', 'PhoneOutgoing',

  // User & Profile
  'User', 'UserCheck', 'UserCog', 'UserMinus', 'UserPlus', 'UserX', 'Users', 'Users2', 'UserCircle',
  'UserCircle2', 'UserSquare', 'UserSquare2', 'Contact', 'Contact2',

  // Business & Finance
  'DollarSign', 'EuroSign', 'PoundSterling', 'YenSign', 'Bitcoin', 'Banknote', 'CreditCard',
  'Wallet', 'Receipt', 'ShoppingBag', 'ShoppingCart', 'Store', 'Tag', 'Tags', 'Percent',
  'CircleDollarSign', 'Coins',

  // Charts & Data
  'BarChart', 'BarChart2', 'BarChart3', 'BarChart4', 'BarChartHorizontal', 'BarChartHorizontalBig',
  'LineChart', 'PieChart', 'TrendingUp', 'TrendingDown', 'Activity', 'Gauge',

  // Time & Calendar
  'Calendar', 'CalendarCheck', 'CalendarCheck2', 'CalendarClock', 'CalendarDays', 'CalendarHeart',
  'CalendarMinus', 'CalendarOff', 'CalendarPlus', 'CalendarRange', 'CalendarSearch', 'CalendarX',
  'CalendarX2', 'Clock', 'Clock1', 'Clock2', 'Clock3', 'Clock4', 'Clock5', 'Clock6', 'Clock7',
  'Clock8', 'Clock9', 'Clock10', 'Clock11', 'Clock12', 'AlarmClock', 'AlarmClockOff', 'Timer',
  'TimerOff', 'TimerReset', 'Hourglass', 'Watch',

  // Devices & Technology
  'Smartphone', 'Tablet', 'Laptop', 'Monitor', 'Tv', 'Tv2', 'Computer', 'Cpu', 'HardDrive',
  'Server', 'Database', 'Wifi', 'WifiOff', 'Bluetooth', 'BluetoothConnected', 'BluetoothOff',
  'BluetoothSearching', 'Cast', 'Airplay', 'Radio', 'Router', 'Usb', 'Cable', 'Plug', 'PlugZap',

  // Power & Battery
  'Power', 'PowerOff', 'Battery', 'BatteryCharging', 'BatteryFull', 'BatteryLow', 'BatteryMedium',
  'BatteryWarning', 'Zap', 'ZapOff', 'BoltIcon', 'Plug2',

  // Weather & Nature
  'Cloud', 'CloudDrizzle', 'CloudFog', 'CloudHail', 'CloudLightning', 'CloudMoon', 'CloudMoonRain',
  'CloudOff', 'CloudRain', 'CloudRainWind', 'CloudSnow', 'CloudSun', 'CloudSunRain', 'Cloudy',
  'Sun', 'SunDim', 'SunMedium', 'SunMoon', 'Sunrise', 'Sunset', 'Moon', 'MoonStar', 'Stars',
  'Droplet', 'Droplets', 'Wind', 'Tornado', 'Snowflake', 'Waves', 'Flame', 'Rainbow',

  // Animals & Nature
  'Bug', 'Bird', 'Fish', 'Flower', 'Flower2', 'Trees', 'Tree', 'Leaf', 'Sprout', 'Shell',
  'Feather', 'Squirrel', 'Rabbit', 'Dog', 'Cat', 'Turtle', 'Snail',

  // Food & Drink
  'Coffee', 'CupSoda', 'Cake', 'Cookie', 'Pizza', 'Soup', 'Salad', 'Sandwich', 'Beef', 'Croissant',
  'Egg', 'EggFried', 'Ham', 'Drumstick', 'Apple', 'Cherry', 'Lemon', 'Grape', 'Strawberry',
  'Carrot', 'Nut', 'IceCream', 'IceCream2', 'Milk', 'MilkOff', 'Beer', 'Wine', 'GlassWater',
  'Utensils', 'UtensilsCrossed',

  // Transportation
  'Car', 'CarFront', 'CarTaxiFront', 'Bus', 'BusFront', 'Train', 'TrainFront', 'Truck', 'Bike',
  'Ship', 'Sailboat', 'Plane', 'PlaneTakeoff', 'PlaneLanding', 'Rocket', 'Ambulance', 'Tractor',
  'Fuel',

  // Buildings & Places
  'Home', 'Building', 'Building2', 'Store', 'Warehouse', 'Factory', 'Hospital', 'School', 'Hotel',
  'Church', 'Castle', 'Tent', 'Mountain', 'MountainSnow', 'Trees', 'TreeDeciduous', 'TreePine',
  'Palmtree', 'Landmark', 'Bridge',

  // Sports & Activities
  'Bike', 'Dumbbell', 'Trophy', 'Award', 'Medal', 'Target', 'Swords', 'Puzzle', 'Gamepad', 'Gamepad2',
  'Dice1', 'Dice2', 'Dice3', 'Dice4', 'Dice5', 'Dice6', 'Club', 'Diamond', 'Heart', 'Spade',
  'Ticket',

  // Text & Typography
  'Type', 'Bold', 'Italic', 'Underline', 'Strikethrough', 'Superscript', 'Subscript', 'AlignLeft',
  'AlignCenter', 'AlignRight', 'AlignJustify', 'AlignHorizontalDistributeCenter',
  'AlignHorizontalDistributeEnd', 'AlignHorizontalDistributeStart', 'AlignHorizontalJustifyCenter',
  'AlignHorizontalJustifyEnd', 'AlignHorizontalJustifyStart', 'AlignHorizontalSpaceAround',
  'AlignHorizontalSpaceBetween', 'AlignVerticalDistributeCenter', 'AlignVerticalDistributeEnd',
  'AlignVerticalDistributeStart', 'AlignVerticalJustifyCenter', 'AlignVerticalJustifyEnd',
  'AlignVerticalJustifyStart', 'AlignVerticalSpaceAround', 'AlignVerticalSpaceBetween',
  'Heading', 'Heading1', 'Heading2', 'Heading3', 'Heading4', 'Heading5', 'Heading6',
  'Quote', 'Text', 'TextCursor', 'TextCursorInput', 'TextQuote', 'TextSelect', 'WholeWord',
  'CaseSensitive', 'CaseUpper', 'CaseLower', 'Pilcrow', 'RemoveFormatting', 'WrapText',

  // Development & Code
  'Code', 'Code2', 'CodeSquare', 'Terminal', 'TerminalSquare', 'Braces', 'Brackets', 'Command',
  'FileCode', 'FileCode2', 'GitBranch', 'GitCommit', 'GitCommitHorizontal', 'GitCompare',
  'GitCompareArrows', 'GitFork', 'GitMerge', 'GitPullRequest', 'GitPullRequestClosed',
  'GitPullRequestCreate', 'GitPullRequestDraft', 'Github', 'Gitlab', 'Bug', 'BugOff', 'BugPlay',
  'TestTube', 'TestTube2', 'TestTubes', 'FlaskConical', 'FlaskRound', 'Beaker',

  // Security & Privacy
  'Lock', 'LockKeyhole', 'LockKeyholeOpen', 'LockOpen', 'Unlock', 'Key', 'KeyRound', 'KeySquare',
  'Shield', 'ShieldAlert', 'ShieldCheck', 'ShieldClose', 'ShieldEllipsis', 'ShieldHalf', 'ShieldMinus',
  'ShieldOff', 'ShieldPlus', 'ShieldQuestion', 'ShieldX', 'Eye', 'EyeOff', 'Fingerprint', 'Scan',
  'ScanFace', 'ScanLine', 'QrCode',

  // Social & Brands
  'Facebook', 'Instagram', 'Twitter', 'Linkedin', 'Youtube', 'Twitch', 'Github', 'Gitlab', 'Figma',
  'Slack', 'Chrome', 'Codepen', 'Codesandbox', 'Framer', 'Pocket', 'Rss',

  // Maps & Location
  'Map', 'MapPin', 'MapPinOff', 'MapPinned', 'Navigation', 'Navigation2', 'NavigationOff',
  'Compass', 'Milestone', 'Radar', 'Locate', 'LocateFixed', 'LocateOff', 'Route', 'RouteOff',
  'Signpost', 'SignpostBig',

  // Tools & Objects
  'Wrench', 'Hammer', 'Drill', 'Screwdriver', 'Ruler', 'Scissors', 'Paintbrush', 'Paintbrush2',
  'PaintBucket', 'Palette', 'Pipette', 'Pen', 'PenTool', 'Pencil', 'PencilLine', 'PencilRuler',
  'Eraser', 'Highlighter', 'Stamp', 'Sticker', 'Magnet', 'Flashlight', 'FlashlightOff',
  'Lamp', 'LampCeiling', 'LampDesk', 'LampFloor', 'LampWallDown', 'LampWallUp', 'Lightbulb',
  'LightbulbOff', 'Candle', 'Cigarette', 'CigaretteOff', 'Fan',

  // Shapes & Symbols
  'Circle', 'CircleDot', 'CircleOff', 'Square', 'SquareDot', 'Triangle', 'Pentagon', 'Hexagon',
  'Octagon', 'Star', 'StarHalf', 'StarOff', 'Hash', 'AtSign', 'Asterisk', 'Slash', 'Percent',
  'Equal', 'NotEqual', 'Infinity', 'Pi', 'Sigma', 'Omega', 'Bookmark', 'BookmarkCheck',
  'BookmarkMinus', 'BookmarkPlus', 'BookmarkX',

  // Special & Effects
  'Sparkle', 'Sparkles', 'Wand', 'Wand2', 'Focus', 'Aperture', 'Contrast', 'Blur', 'ScanEye',
  'Eye', 'EyeOff', 'Glasses', 'Telescope', 'Microscope', 'Crosshair', 'Target', 'CircleDot',

  // Miscellaneous
  'Gift', 'Package', 'Package2', 'PackageCheck', 'PackageMinus', 'PackageOpen', 'PackagePlus',
  'PackageSearch', 'PackageX', 'Boxes', 'Archive', 'ArchiveRestore', 'ArchiveX', 'Inbox',
  'Printer', 'Scan', 'Webhook', 'Link', 'Link2', 'LinkIcon', 'ExternalLink', 'Anchor',
  'Paperclip', 'Bookmark', 'Flag', 'FlagOff', 'FlagTriangleLeft', 'FlagTriangleRight',
  'Pin', 'PinOff', 'Footprints', 'Flame', 'Bomb', 'Shell', 'Sword', 'Swords', 'Siren',
  'Construction', 'HardHat', 'Pickaxe', 'Shovel', 'VenetianMask', 'PartyPopper',
  'Smile', 'SmilePlus', 'Frown', 'Meh', 'Laugh', 'Angry', 'ThumbsUp', 'ThumbsDown',
  'Heart', 'HeartCrack', 'HeartHandshake', 'HeartOff', 'HeartPulse', 'Handshake', 'HandMetal',
];
