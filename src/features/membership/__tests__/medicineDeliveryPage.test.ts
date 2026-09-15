import { resolveMembershipServicePageVariant } from '../membershipServicePageVariant';
import {
  filterMedicineRequests,
  medicineOrderCode,
  toMedicineOrderViews,
} from '../medicineOrders';
import type { ServiceRequest } from '@/features/home/types/home';
import type { MemberDelivery } from '@/features/deliveries/types';

const medicineRequest: ServiceRequest = {
  id: 'b7b95a6c-a1bb-4a7c-a1c1-5c6f3bdfccc1',
  seniorId: 'senior-1',
  serviceId: 'svc-med',
  serviceName: 'Medicine Delivery',
  serviceSlug: 'medicine',
  status: 'REQUESTED',
  notes: 'Prescription upload: rx.jpg',
};

const groceryRequest: ServiceRequest = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  seniorId: 'senior-1',
  serviceId: 'svc-groc',
  serviceName: 'Grocery Delivery',
  serviceSlug: 'grocery',
  status: 'REQUESTED',
  notes: null,
};

describe('Medicine Delivery page', () => {
  it('keeps the three gate states used by the Medicine Delivery mockups', () => {
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

  it('maps only real medicine service requests into order rows', () => {
    expect(filterMedicineRequests([medicineRequest, groceryRequest])).toEqual([medicineRequest]);
    expect(medicineOrderCode(medicineRequest)).toBe('#AW-MED-B7B95A');

    const views = toMedicineOrderViews([medicineRequest, groceryRequest], []);
    expect(views).toHaveLength(1);
    expect(views[0]?.orderCode).toBe('#AW-MED-B7B95A');
    expect(views[0]?.statusLabel).toBe('Requested');
    expect(views[0]?.statusDetail).toBe('Prescription upload: rx.jpg');
    expect(views[0]?.tone).toBe('placed');
  });

  it('uses live delivery status when a delivery is linked', () => {
    const delivery: MemberDelivery = {
      id: 'del-1',
      careManagerId: 'cm-1',
      seniorId: 'senior-1',
      serviceRequestId: medicineRequest.id,
      title: 'Medicine',
      customerName: 'John',
      location: 'Home',
      status: 'EN_ROUTE',
      scheduledAt: null,
      executiveName: 'Ravi',
    };
    const [view] = toMedicineOrderViews([medicineRequest], [delivery]);
    expect(view?.statusLabel).toBe('En Route');
    expect(view?.tone).toBe('en_route');
    expect(view?.trackable).toBe(true);
    expect(view?.deliveryId).toBe('del-1');
    expect(view?.subtitle).toBe('With Ravi');
  });
});
