import { resolveMembershipServicePageVariant } from '../membershipServicePageVariant';
import {
  filterGroceryRequests,
  splitGroceryOrders,
  toGroceryOrderViews,
} from '../groceryOrders';
import type { ServiceRequest } from '@/features/home/types/home';
import type { MemberDelivery } from '@/features/deliveries/types';

const groceryRequest: ServiceRequest = {
  id: 'b7b95a6c-a1bb-4a7c-a1c1-5c6f3bdfccc1',
  seniorId: 'senior-1',
  serviceId: 'svc-groc',
  serviceName: 'Grocery Delivery',
  serviceSlug: 'grocery',
  status: 'REQUESTED',
  notes: 'Typed grocery list:\nMilk, eggs, tomatoes',
};

const completedRequest: ServiceRequest = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  seniorId: 'senior-1',
  serviceId: 'svc-groc',
  serviceName: 'Grocery Delivery',
  serviceSlug: 'grocery',
  status: 'COMPLETED',
  notes: 'Grocery & Vegetables · Items: 12',
};

const medicineRequest: ServiceRequest = {
  id: 'cccccccc-dddd-eeee-ffff-000000000000',
  seniorId: 'senior-1',
  serviceId: 'svc-med',
  serviceName: 'Medicine Delivery',
  serviceSlug: 'medicine',
  status: 'REQUESTED',
  notes: null,
};

describe('Grocery Delivery page', () => {
  it('keeps the three gate states from the Grocery mockups', () => {
    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: false,
        hasMembership: true,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('non_serviceable');

    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: true,
        hasMembership: false,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('serviceable_no_membership');

    expect(
      resolveMembershipServicePageVariant({
        inServiceArea: true,
        hasMembership: true,
        areaReady: true,
        membershipReady: true,
      }),
    ).toBe('serviceable_with_membership');
  });

  it('maps only real grocery service requests into order rows', () => {
    expect(filterGroceryRequests([groceryRequest, medicineRequest])).toEqual([groceryRequest]);
    const views = toGroceryOrderViews([groceryRequest, completedRequest, medicineRequest], []);
    expect(views).toHaveLength(2);
    expect(views[0]?.tone).toBe('placed');
    expect(views[1]?.statusLabel).toBe('Delivered');
    expect(views[1]?.successBanner).toMatch(/Order Delivered Successfully/);

    const split = splitGroceryOrders(views);
    expect(split.current).toHaveLength(1);
    expect(split.past).toHaveLength(1);
  });

  it('uses live delivery status when a delivery is linked', () => {
    const delivery: MemberDelivery = {
      id: 'del-1',
      careManagerId: 'cm-1',
      seniorId: 'senior-1',
      serviceRequestId: groceryRequest.id,
      title: 'Grocery',
      customerName: 'John',
      location: 'Home',
      status: 'EN_ROUTE',
      scheduledAt: null,
      executiveName: 'Ravi',
    };
    const [view] = toGroceryOrderViews([groceryRequest], [delivery]);
    expect(view?.statusLabel).toBe('In Progress');
    expect(view?.tone).toBe('en_route');
    expect(view?.trackable).toBe(true);
    expect(view?.subtitle).toBe('With Ravi');
    expect(view?.itemsSummary).toMatch(/^Items:/);
  });
});
