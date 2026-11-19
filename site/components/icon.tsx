import {
  Activity,
  BookOpen,
  Box,
  CalendarDays,
  ChartCandlestick,
  ChartColumn,
  Clock,
  Coins,
  Database,
  FileText,
  Globe,
  GraduationCap,
  Key,
  Layers,
  LifeBuoy,
  List,
  type LucideIcon,
  Megaphone,
  Newspaper,
  Play,
  Plug,
  Rocket,
  RotateCw,
  Server,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';

/**
 * The icons the pages and docs.json name. docs.json set Mintlify's library to
 * Lucide, and a few pages carry Font Awesome names Lucide does not have
 * (layer-group, gear, file-lines, rotate): Mintlify drew nothing for those,
 * here they map to their Lucide twins.
 */
const icons: Record<string, LucideIcon> = {
  activity: Activity,
  'book-open': BookOpen,
  box: Box,
  'calendar-days': CalendarDays,
  'chart-candlestick': ChartCandlestick,
  'chart-column': ChartColumn,
  clock: Clock,
  coins: Coins,
  database: Database,
  'file-lines': FileText,
  'file-text': FileText,
  gear: Settings,
  globe: Globe,
  'graduation-cap': GraduationCap,
  key: Key,
  'layer-group': Layers,
  layers: Layers,
  'life-buoy': LifeBuoy,
  list: List,
  megaphone: Megaphone,
  newspaper: Newspaper,
  play: Play,
  plug: Plug,
  rocket: Rocket,
  rotate: RotateCw,
  server: Server,
  settings: Settings,
  users: Users,
  wallet: Wallet,
};

export function iconExists(name: string): boolean {
  return name in icons;
}

/**
 * <Icon icon="globe" size={20} /> as the pages write it. An unknown name fails
 * the build instead of leaving a silent gap: add it to the map above.
 */
export function Icon({ icon, size = 16, className }: { icon: string; size?: number; className?: string }) {
  const Component = icons[icon];
  if (!Component) throw new Error(`Unknown icon "${icon}": add it to site/components/icon.tsx`);
  return <Component aria-hidden="true" width={size} height={size} strokeWidth={1.75} className={className} />;
}
