import { staffHomeTabs } from '@/features/auth/roleRouting';
import { staffHomeConfig } from '../staffHomeConfig';
import { parseStaffKind, STAFF_KIND_LABELS } from '../staffKind';
import { summarizeCareToday } from '../selectors';
import {
  buildVisitStaffSummary,
  staffVisitStatusPresentation,
  visitToStaffScheduleItem,
} from '../staffHomeModel';
import type { Visit } from '@/features/home/types/home';

describe('staffKind', () => {
  it('defaults unknown values to care manager', () => {
    expect(parseStaffKind(null)).toBe('CARE_MANAGER');
    expect(parseStaffKind('DRIVER')).toBe('CARE_MANAGER');
    expect(parseStaffKind('COMPANION')).toBe('COMPANION');
    expect(parseStaffKind('DELIVERY_EXECUTIVE')).toBe('DELIVERY_EXECUTIVE');
  });

  it('labels the three Care app roles', () => {
    expect(STAFF_KIND_LABELS.CARE_MANAGER).toBe('Care Manager');
    expect(STAFF_KIND_LABELS.COMPANION).toBe('Companion');
    expect(STAFF_KIND_LABELS.DELIVERY_EXECUTIVE).toBe('Delivery Executive');
  });

  it('uses the same staff tabs for every staff kind', () => {
    expect(staffHomeTabs('CARE_MANAGER')).toBe('staff');
    expect(staffHomeTabs('COMPANION')).toBe('staff');
    expect(staffHomeTabs('DELIVERY_EXECUTIVE')).toBe('staff');
  });

  it('configures distinct home copy per staff kind', () => {
    expect(staffHomeConfig('CARE_MANAGER').listTitle).toBe("Today's Schedule");
    expect(staffHomeConfig('CARE_MANAGER').viewAllHref).toBe('/(care)/tasks');
    expect(staffHomeConfig('COMPANION').summary.primary).toBe('Assigned');
    expect(staffHomeConfig('COMPANION').viewAllHref).toBe('/(care)/tasks');
    expect(staffHomeConfig('DELIVERY_EXECUTIVE').summary.primary).toBe('Deliveries');
    expect(staffHomeConfig('DELIVERY_EXECUTIVE').listTitle).toBe("Today's Deliveries");
    expect(staffHomeConfig('DELIVERY_EXECUTIVE').viewAllHref).toBe('/(care)/tasks');
  });
});

describe('staff home selectors', () => {
  const visits: Visit[] = [
    {
      id: '1',
      seniorId: 's1',
      careManagerId: null,
      employeeId: null,
      careManagerName: null,
      status: 'COMPLETED',
      scheduledAt: '2026-09-02T09:00:00.000Z',
      startedAt: null,
      completedAt: '2026-09-02T10:00:00.000Z',
      notes: 'Kandivali West',
    },
    {
      id: '2',
      seniorId: 's2',
      careManagerId: null,
      employeeId: null,
      careManagerName: null,
      status: 'IN_PROGRESS',
      scheduledAt: '2026-09-02T10:00:00.000Z',
      startedAt: '2026-09-02T10:05:00.000Z',
      completedAt: null,
      notes: null,
    },
    {
      id: '3',
      seniorId: 's3',
      careManagerId: null,
      employeeId: null,
      careManagerName: null,
      status: 'SCHEDULED',
      scheduledAt: null,
      startedAt: null,
      completedAt: null,
      notes: null,
    },
    {
      id: '4',
      seniorId: 's4',
      careManagerId: null,
      employeeId: null,
      careManagerName: null,
      status: 'NO_SHOW',
      scheduledAt: null,
      startedAt: null,
      completedAt: null,
      notes: null,
    },
  ];

  it('summarizes today totals including emergency', () => {
    expect(summarizeCareToday(visits)).toMatchObject({
      total: 4,
      completed: 1,
      inProgress: 1,
      upcoming: 1,
      emergency: 1,
    });
  });

  it('builds role-labeled summary tiles', () => {
    const stats = buildVisitStaffSummary(staffHomeConfig('COMPANION'), visits);
    expect(stats.map((stat) => stat.label)).toEqual(['Assigned', 'Completed', 'In Progress', 'Emergency']);
    expect(stats.map((stat) => stat.value)).toEqual([4, 1, 1, 1]);
  });

  it('maps visits into schedule rows', () => {
    const item = visitToStaffScheduleItem(visits[1], 'Visit');
    expect(item.title).toBe('Visit - Senior ID s2');
    expect(item.statusLabel).toBe('In Progress');
    expect(item.statusTone).toBe('safe');
    expect(staffVisitStatusPresentation('SCHEDULED')).toEqual({ label: 'Upcoming', tone: 'info' });
  });
});
