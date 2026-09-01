import { useMemo } from 'react';
import { CarePersonVisitScreen } from './CarePersonVisitScreen';
import { MOCK_CARE_MANAGER, type MembershipCarePerson, type MembershipVisit } from './mockStaff';
import { useMyVisits, useUpcomingVisits } from '@/features/home/hooks/queries';
import type { Visit } from '@/features/home/types/home';

function formatWhen(iso: string | null): string {
  if (!iso) {
    return 'Schedule pending';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toMembershipVisit(visit: Visit, upcoming: boolean): MembershipVisit {
  return {
    id: visit.id,
    label: upcoming ? 'Care Manager visit' : 'Completed visit',
    when: formatWhen(visit.scheduledAt),
    status: upcoming ? 'Upcoming' : 'Completed',
    notes: visit.notes ?? undefined,
  };
}

export function CareManagerVisitScreen() {
  const upcoming = useUpcomingVisits();
  const mine = useMyVisits();

  const person = useMemo((): MembershipCarePerson => {
    const upcomingItems = upcoming.data?.items ?? [];
    const historyItems = (mine.data?.items ?? []).filter(
      (item) => item.status === 'COMPLETED' || item.status === 'CHECKED_OUT',
    );
    const next = upcomingItems[0];
    const named = next?.careManagerName || historyItems[0]?.careManagerName;

    return {
      ...MOCK_CARE_MANAGER,
      name: named?.trim() || MOCK_CARE_MANAGER.name,
      nextVisit: next
        ? toMembershipVisit(next, true)
        : MOCK_CARE_MANAGER.nextVisit,
      history:
        historyItems.length > 0
          ? historyItems.slice(0, 5).map((item) => toMembershipVisit(item, false))
          : MOCK_CARE_MANAGER.history,
    };
  }, [upcoming.data, mine.data]);

  return (
    <CarePersonVisitScreen
      title="Care Manager Visit"
      person={person}
      slug="care-manager"
      videoHint="Your Care Manager checks overall condition monthly, helps in emergencies, and coordinates included AgeWell services. Visit schedule syncs from AgeWell ops."
    />
  );
}
