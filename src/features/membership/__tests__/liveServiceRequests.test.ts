import {
  filterRequestsBySlug,
  toLiveRequestViews,
} from '../liveServiceRequests';
import type { ServiceRequest } from '@/features/home/types/home';

const base: ServiceRequest = {
  id: '1',
  seniorId: 's',
  serviceId: 'svc',
  serviceName: 'Banking Companion',
  serviceSlug: 'banking-companion',
  status: 'COMPLETED',
  notes: 'Pension Withdrawal. Support requested',
  createdAt: '2026-09-12T10:00:00Z',
};

describe('liveServiceRequests', () => {
  it('filters by slug', () => {
    expect(
      filterRequestsBySlug(
        [base, { ...base, id: '2', serviceSlug: 'legal' }],
        'banking-companion',
      ),
    ).toHaveLength(1);
  });

  it('maps status tones and titles from notes', () => {
    const views = toLiveRequestViews([
      base,
      { ...base, id: '2', status: 'SCHEDULED', notes: 'KYC Update. In progress' },
      { ...base, id: '3', status: 'REQUESTED', notes: null, createdAt: null },
    ]);
    expect(views[0]?.title).toBe('Pension Withdrawal');
    expect(views[0]?.tone).toBe('completed');
    expect(views[1]?.tone).toBe('scheduled');
    expect(views[2]?.title).toBe('Service request');
    expect(views[2]?.dateLabel).toBe('Recently');
  });
});
