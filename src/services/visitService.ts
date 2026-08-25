import { mockCareManagers } from '@/mock/careManagers';
import { mockVisitReports, mockVisits } from '@/mock/visits';
import type { CareManager, Visit, VisitReport } from '@/types';
import { delay } from '@/utils/delay';

export async function getVisitsBySeniorId(seniorId: string): Promise<Visit[]> {
  await delay(250);
  return mockVisits
    .filter((visit) => visit.seniorId === seniorId)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
}

export async function getVisitById(id: string): Promise<Visit | null> {
  await delay(200);
  return mockVisits.find((visit) => visit.id === id) ?? null;
}

export async function getUpcomingVisit(seniorId: string): Promise<Visit | null> {
  const visits = await getVisitsBySeniorId(seniorId);
  return visits.find((visit) => visit.status === 'scheduled' || visit.status === 'in_progress') ?? null;
}

export async function getLatestCompletedVisit(seniorId: string): Promise<Visit | null> {
  const visits = await getVisitsBySeniorId(seniorId);
  return visits.find((visit) => visit.status === 'completed') ?? null;
}

export async function getVisitReport(visitId: string): Promise<VisitReport | null> {
  await delay(200);
  return mockVisitReports.find((report) => report.visitId === visitId) ?? null;
}

export async function getCareManagerById(id: string): Promise<CareManager | null> {
  await delay(150);
  return mockCareManagers.find((manager) => manager.id === id) ?? null;
}
