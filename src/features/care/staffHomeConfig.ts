import type { ColorTone } from '@/constants/theme';
import { colors } from '@/constants/theme';
import type { IconName } from '@/components/ui';
import { STAFF_KIND_LABELS, type StaffKind } from './staffKind';

export type StaffHomeConfig = {
  kind: StaffKind;
  roleLabel: string;
  accent: string;
  accentSoft: string;
  summary: {
    primary: string;
    completed: string;
    third: string;
    fourth: string;
    thirdTone: ColorTone;
    fourthTone: ColorTone;
  };
  listTitle: string;
  viewAllLabel: string;
  viewAllHref: string | null;
  emptyIcon: IconName;
  emptyTitle: string;
  emptyMessage: string;
  /** Prefix used in schedule row titles, e.g. "Visit". */
  itemPrefix: string;
};

export const STAFF_HOME_CONFIG: Record<StaffKind, StaffHomeConfig> = {
  CARE_MANAGER: {
    kind: 'CARE_MANAGER',
    roleLabel: STAFF_KIND_LABELS.CARE_MANAGER,
    accent: colors.primary,
    accentSoft: colors.primarySoft,
    summary: {
      primary: 'Appointments',
      completed: 'Completed',
      third: 'In Progress',
      fourth: 'Emergency',
      thirdTone: 'warning',
      fourthTone: 'emergency',
    },
    listTitle: "Today's Schedule",
    viewAllLabel: 'View All',
    viewAllHref: '/(care)/tasks',
    emptyIcon: 'calendar-outline',
    emptyTitle: 'No visits today',
    emptyMessage: 'Assigned visits for today will appear here.',
    itemPrefix: 'Visit',
  },
  COMPANION: {
    kind: 'COMPANION',
    roleLabel: STAFF_KIND_LABELS.COMPANION,
    accent: colors.primary,
    accentSoft: colors.primarySoft,
    summary: {
      primary: 'Assigned',
      completed: 'Completed',
      third: 'In Progress',
      fourth: 'Emergency',
      thirdTone: 'warning',
      fourthTone: 'emergency',
    },
    listTitle: "Today's Tasks",
    viewAllLabel: 'View All',
    viewAllHref: '/(care)/tasks',
    emptyIcon: 'people-outline',
    emptyTitle: 'No visits today',
    emptyMessage: 'Assigned companion visits will appear here.',
    itemPrefix: 'Visit',
  },
  DELIVERY_EXECUTIVE: {
    kind: 'DELIVERY_EXECUTIVE',
    roleLabel: STAFF_KIND_LABELS.DELIVERY_EXECUTIVE,
    accent: colors.warning,
    accentSoft: colors.warningSoft,
    summary: {
      primary: 'Deliveries',
      completed: 'Completed',
      third: 'Pending',
      fourth: 'Failed',
      thirdTone: 'warning',
      fourthTone: 'emergency',
    },
    listTitle: "Today's Deliveries",
    viewAllLabel: 'View All',
    viewAllHref: '/(care)/tasks',
    emptyIcon: 'bike',
    emptyTitle: 'No deliveries yet',
    emptyMessage: 'Grocery, food, and medicine drops assigned to you will appear here.',
    itemPrefix: 'Delivery',
  },
};

export function staffHomeConfig(kind: StaffKind): StaffHomeConfig {
  return STAFF_HOME_CONFIG[kind];
}
