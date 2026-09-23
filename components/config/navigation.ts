import {
  BarChart3,
  Building2,
  Car,
  DollarSign,
  FileText,
  Heart,
  MessageSquare,
  Route,
  Shield,
  Ticket,
  UserCheck,
  Users,
  Wallet,
  AlertTriangle,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { getPagesBySection, type NavSection, type PageConfig } from './pages';

export interface NavItem extends PageConfig {
  icon: LucideIcon;
}

const PAGE_ICONS: Record<string, LucideIcon> = {
  dashboard: BarChart3,
  stations: Building2,
  unions: Shield,
  vehicles: Car,
  drivers: UserCheck,
  trips: Route,
  passengers: Users,
  incidents: AlertTriangle,
  'incident-claims': Heart,
  'death-traps': Zap,
  'accident-analysis': FileText,
  reports: BarChart3,
  revenue: DollarSign,
  accounts: Wallet,
  tickets: Ticket,
  'ratings-complaints': MessageSquare,
  users: Users,
};

const SECTION_LABELS: Record<NavSection, string> = {
  core: 'Core Operations',
  safety: 'Safety & Incidents',
  reports: 'Reports & Analytics',
  admin: 'Administration',
};

function toNavItems(pages: PageConfig[]): NavItem[] {
  return pages.map((page) => ({
    ...page,
    icon: PAGE_ICONS[page.id] ?? BarChart3,
  }));
}

export const NAV_SECTIONS: { section: NavSection; title: string; items: NavItem[] }[] = (
  ['core', 'safety', 'reports', 'admin'] as NavSection[]
).map((section) => ({
  section,
  title: SECTION_LABELS[section],
  items: toNavItems(getPagesBySection(section)),
}));
