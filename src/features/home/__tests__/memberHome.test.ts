import { membershipMemberId, upcomingCommunityEvents, upcomingDeliveries } from '../memberHome';

describe('member home helpers', () => {
  it('builds a short member id from the senior id without using a mock AW123456', () => {
    expect(membershipMemberId('0b3922d7-6ec2-4810-a259-58d0ec262f69')).toBe('AW262F69');
    expect(membershipMemberId(undefined)).toBeNull();
    expect(membershipMemberId('0b3922d7-6ec2-4810-a259-58d0ec262f69')).not.toBe('AW123456');
  });

  it('keeps only grocery, food, and medicine requests as deliveries', () => {
    const items = upcomingDeliveries([
      { id: '1', seniorId: 's', serviceId: 'a', serviceName: 'Grocery Delivery', serviceSlug: 'grocery', status: 'REQUESTED', notes: null },
      { id: '2', seniorId: 's', serviceId: 'b', serviceName: 'Companion Visit', serviceSlug: 'companion', status: 'REQUESTED', notes: null },
      { id: '3', seniorId: 's', serviceId: 'c', serviceName: 'Food Delivery', serviceSlug: 'food', status: 'CONFIRMED', notes: null },
    ]);
    expect(items.map((item) => item.serviceSlug)).toEqual(['grocery', 'food']);
  });

  it('sorts upcoming community events by date', () => {
    const items = upcomingCommunityEvents(
      [
        { id: 'late', title: 'Movie Screening', description: null, eventDate: '2026-06-02T16:00:00.000Z', capacity: 18 },
        { id: 'soon', title: 'Bhajan Sandhya', description: null, eventDate: '2026-05-25T17:00:00.000Z', capacity: 12 },
      ],
      2,
      new Date('2026-05-01T00:00:00.000Z'),
    );
    expect(items.map((item) => item.title)).toEqual(['Bhajan Sandhya', 'Movie Screening']);
  });
});
