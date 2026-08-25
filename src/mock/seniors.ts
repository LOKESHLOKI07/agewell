import type { Senior } from '@/types';

export const mockSeniors: Senior[] = [
  {
    id: 'senior-lakshmi',
    familyId: 'family-sharma',
    firstName: 'Lakshmi',
    lastName: 'Sharma',
    age: 72,
    gender: 'female',
    address: {
      line1: '14, Shanti Niketan',
      area: 'Borivali West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400092',
    },
    careStatus: 'safe_and_well',
    membershipId: 'membership-family',
    primaryDoctor: {
      name: 'Dr. Mehta',
      specialty: 'Cardiology',
    },
    hospital: {
      name: 'Mock Hospital',
      area: 'Borivali West',
    },
    emergencyContacts: [
      {
        id: 'contact-rahul',
        name: 'Rahul Sharma',
        relationship: 'Son',
        phone: '+91 XXXXX XXXXX',
      },
    ],
  },
];

export const mockSenior: Senior = mockSeniors[0] as Senior;
