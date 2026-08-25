import type { Family, User } from '@/types';

export const mockUser: User = {
  id: 'user-rahul',
  firstName: 'Rahul',
  lastName: 'Sharma',
  email: 'rahul@example.com',
  phone: '+91 XXXXX XXXXX',
  role: 'family_member',
  familyId: 'family-sharma',
};

export const mockFamily: Family = {
  id: 'family-sharma',
  name: 'Sharma Family',
  seniorIds: ['senior-lakshmi'],
  memberIds: ['user-rahul'],
};

export const MOCK_OTP = '123456';
