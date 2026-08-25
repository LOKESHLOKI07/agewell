import {
  groupCareItemsByPeriod,
  schedulePeriodForTime,
  pickQuickServices,
} from '../homeViewModel';
import type { CatalogService, TodayCareItem } from '../../types/home';

describe('schedule period grouping', () => {
  const morning: TodayCareItem = {
    id: '1',
    kind: 'visit',
    title: 'Morning visit',
    subtitle: 'Scheduled',
    status: 'Scheduled',
    icon: 'people',
    sortAt: new Date('2026-08-24T08:00:00').getTime(),
  };
  const afternoon: TodayCareItem = {
    ...morning,
    id: '2',
    title: 'Afternoon visit',
    sortAt: new Date('2026-08-24T14:00:00').getTime(),
  };
  const evening: TodayCareItem = {
    ...morning,
    id: '3',
    title: 'Evening visit',
    sortAt: new Date('2026-08-24T19:00:00').getTime(),
  };
  const untimed: TodayCareItem = {
    ...morning,
    id: '4',
    title: 'Medication',
    kind: 'medication',
    sortAt: null,
  };

  it('classifies local hours into morning, afternoon, and evening', () => {
    expect(schedulePeriodForTime(morning.sortAt)).toBe('morning');
    expect(schedulePeriodForTime(afternoon.sortAt)).toBe('afternoon');
    expect(schedulePeriodForTime(evening.sortAt)).toBe('evening');
    expect(schedulePeriodForTime(null)).toBe('unscheduled');
  });

  it('groups without inventing items', () => {
    const groups = groupCareItemsByPeriod([evening, morning, untimed, afternoon]);
    expect(groups.map((g) => g.period)).toEqual(['morning', 'afternoon', 'evening', 'unscheduled']);
    expect(groups.find((g) => g.period === 'morning')?.items).toHaveLength(1);
  });
});

describe('quick services picker', () => {
  it('only returns catalogue services and prefers companion/food/transport names', () => {
    const services: CatalogService[] = [
      { id: '1', name: 'Physio', category: 'HEALTH', description: '' },
      { id: '2', name: 'Companion Visit', category: 'CARE', description: 'Friendly companion' },
      { id: '3', name: 'Grocery Help', category: 'FOOD_HOME', description: '' },
      { id: '4', name: 'Cab to Clinic', category: 'MOBILITY', description: 'Transport' },
    ];
    const picked = pickQuickServices(services);
    expect(picked.map((s) => s.id)).toEqual(['2', '3', '4', '1']);
    expect(picked.every((s) => services.some((src) => src.id === s.id))).toBe(true);
  });
});
