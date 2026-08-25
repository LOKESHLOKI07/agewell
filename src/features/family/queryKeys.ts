export const familyQueryKeys = {
  all: ['family'] as const,
  me: ['family', 'me'] as const,
  seniors: ['family', 'seniors'] as const,
  selectedSenior: ['family', 'selectedSenior'] as const,
  visits: (seniorId: string) => ['family', 'visits', seniorId] as const,
  visitsToday: (seniorId: string) => ['family', 'visits', seniorId, 'today'] as const,
  visitsUpcoming: (seniorId: string) => ['family', 'visits', seniorId, 'upcoming'] as const,
  appointments: (seniorId: string) => ['family', 'appointments', seniorId] as const,
  medications: (seniorId: string) => ['family', 'medications', seniorId] as const,
  medicalRecords: (seniorId: string) => ['family', 'health', 'records', seniorId] as const,
  labResults: (seniorId: string) => ['family', 'health', 'labs', seniorId] as const,
  documents: (seniorId: string) => ['family', 'health', 'documents', seniorId] as const,
  providers: (seniorId: string) => ['family', 'health', 'providers', seniorId] as const,
  serviceRequests: (seniorId: string) => ['family', 'serviceRequests', seniorId] as const,
  membership: (seniorId: string) => ['family', 'membership', seniorId] as const,
  membershipUsage: (seniorId: string) => ['family', 'membershipUsage', seniorId] as const,
  emergency: (seniorId: string) => ['family', 'emergency', seniorId] as const,
  notifications: ['family', 'notifications'] as const,
};

export function familySeniorScopeParams(seniorId: string) {
  return { senior_id: seniorId };
}
