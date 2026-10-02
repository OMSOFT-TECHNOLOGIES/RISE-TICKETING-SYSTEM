import React from 'react';
import { Crown, UserCheck } from 'lucide-react';
import { cn } from '../ui/utils';
import { userRoles } from '../constants/userRoles';

type PillStyle = { dot: string; text: string; bg: string };

/** High-contrast pills for registry tables (light theme first). */
const statusStyles: Record<string, PillStyle & { label: string }> = {
  active: {
    dot: 'bg-emerald-700',
    text: 'text-emerald-950 dark:text-emerald-100',
    bg: 'border-emerald-400 bg-emerald-100 dark:bg-emerald-950/55 dark:border-emerald-500/60',
    label: 'Active',
  },
  inactive: {
    dot: 'bg-slate-600',
    text: 'text-slate-900 dark:text-slate-100',
    bg: 'border-slate-400 bg-slate-100 dark:bg-slate-800/80 dark:border-slate-500/70',
    label: 'Inactive',
  },
  suspended: {
    dot: 'bg-red-700',
    text: 'text-red-950 dark:text-red-100',
    bg: 'border-red-400 bg-red-100 dark:bg-red-950/55 dark:border-red-500/60',
    label: 'Suspended',
  },
};

const roleStyles: Record<string, PillStyle> = {
  super_admin: {
    dot: 'bg-red-700',
    text: 'text-red-950 dark:text-red-100',
    bg: 'border-red-400 bg-red-100 dark:bg-red-950/55 dark:border-red-500/60',
  },
  admin: {
    dot: 'bg-blue-700',
    text: 'text-blue-950 dark:text-blue-100',
    bg: 'border-blue-400 bg-blue-100 dark:bg-blue-950/55 dark:border-blue-500/60',
  },
  regional_manager: {
    dot: 'bg-indigo-700',
    text: 'text-indigo-950 dark:text-indigo-100',
    bg: 'border-indigo-400 bg-indigo-100 dark:bg-indigo-950/55 dark:border-indigo-500/60',
  },
  district_manager: {
    dot: 'bg-teal-700',
    text: 'text-teal-950 dark:text-teal-100',
    bg: 'border-teal-400 bg-teal-100 dark:bg-teal-950/55 dark:border-teal-500/60',
  },
  admin_operation: {
    dot: 'bg-sky-700',
    text: 'text-sky-950 dark:text-sky-100',
    bg: 'border-sky-400 bg-sky-100 dark:bg-sky-950/55 dark:border-sky-500/60',
  },
  admin_hrm: {
    dot: 'bg-rose-700',
    text: 'text-rose-950 dark:text-rose-100',
    bg: 'border-rose-400 bg-rose-100 dark:bg-rose-950/55 dark:border-rose-500/60',
  },
  district_incident_reporter: {
    dot: 'bg-amber-700',
    text: 'text-amber-950 dark:text-amber-100',
    bg: 'border-amber-400 bg-amber-100 dark:bg-amber-950/55 dark:border-amber-500/60',
  },
  incident_investigator: {
    dot: 'bg-orange-700',
    text: 'text-orange-950 dark:text-orange-100',
    bg: 'border-orange-400 bg-orange-100 dark:bg-orange-950/55 dark:border-orange-500/60',
  },
  hospital_incident_claimer: {
    dot: 'bg-purple-700',
    text: 'text-purple-950 dark:text-purple-100',
    bg: 'border-purple-400 bg-purple-100 dark:bg-purple-950/55 dark:border-purple-500/60',
  },
  station_manager: {
    dot: 'bg-cyan-700',
    text: 'text-cyan-950 dark:text-cyan-100',
    bg: 'border-cyan-400 bg-cyan-100 dark:bg-cyan-950/55 dark:border-cyan-500/60',
  },
  station_worker: {
    dot: 'bg-slate-700',
    text: 'text-slate-950 dark:text-slate-100',
    bg: 'border-slate-400 bg-slate-100 dark:bg-slate-800/80 dark:border-slate-500/70',
  },
  mttd: {
    dot: 'bg-yellow-700',
    text: 'text-yellow-950 dark:text-yellow-100',
    bg: 'border-yellow-500 bg-yellow-100 dark:bg-yellow-950/55 dark:border-yellow-600/60',
  },
  fire_service: {
    dot: 'bg-red-700',
    text: 'text-red-950 dark:text-red-100',
    bg: 'border-red-400 bg-red-50 dark:bg-red-950/55 dark:border-red-500/60',
  },
  police: {
    dot: 'bg-blue-800',
    text: 'text-blue-950 dark:text-blue-100',
    bg: 'border-blue-500 bg-blue-100 dark:bg-blue-950/55 dark:border-blue-500/60',
  },
  road_safety_center: {
    dot: 'bg-lime-700',
    text: 'text-lime-950 dark:text-lime-100',
    bg: 'border-lime-500 bg-lime-100 dark:bg-lime-950/55 dark:border-lime-600/60',
  },
  road_safety_manager: {
    dot: 'bg-green-700',
    text: 'text-green-950 dark:text-green-100',
    bg: 'border-green-500 bg-green-100 dark:bg-green-950/55 dark:border-green-600/60',
  },
  ambulance_service: {
    dot: 'bg-fuchsia-700',
    text: 'text-fuchsia-950 dark:text-fuchsia-100',
    bg: 'border-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-950/55 dark:border-fuchsia-500/60',
  },
};

const defaultRoleStyle: PillStyle = {
  dot: 'bg-violet-700',
  text: 'text-violet-950 dark:text-violet-100',
  bg: 'border-violet-400 bg-violet-100 dark:bg-violet-950/55 dark:border-violet-500/60',
};

const pillBase =
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap';

export function UserStatusBadge({ status }: { status: string }) {
  const styles =
    statusStyles[status] ?? {
      dot: 'bg-neutral-600',
      text: 'text-neutral-950 dark:text-neutral-100',
      bg: 'border-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 dark:border-neutral-500/70',
      label: status.charAt(0).toUpperCase() + status.slice(1),
    };

  return (
    <span className={cn(pillBase, styles.bg, styles.text)}>
      <span className={cn('h-2 w-2 shrink-0 rounded-full', styles.dot)} aria-hidden />
      {styles.label}
    </span>
  );
}

export function UserRoleBadge({ role }: { role: string }) {
  const roleInfo = userRoles.find((r) => r.value === role);
  const label = roleInfo?.label ?? role.replace(/_/g, ' ');
  const styles = roleStyles[role] ?? defaultRoleStyle;
  const Icon = role.includes('admin') ? Crown : UserCheck;

  return (
    <span className={cn(pillBase, styles.bg, styles.text, 'max-w-[200px]')}>
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function UserOnlineBadge() {
  return (
    <span
      className={cn(
        pillBase,
        'border-emerald-400 bg-emerald-100 text-emerald-950 dark:bg-emerald-950/55 dark:text-emerald-100 dark:border-emerald-500/60'
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-700 animate-pulse" aria-hidden />
      Online
    </span>
  );
}
