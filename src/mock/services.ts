import type { ServiceCatalogItem } from '@/types';

export const mockServices: ServiceCatalogItem[] = [
  {
    id: 'svc-healthcare',
    title: 'Healthcare Coordination',
    description: 'We help organise doctors, reports, and follow-ups for your parent.',
    icon: 'medkit-outline',
  },
  {
    id: 'svc-companion',
    title: 'Companion Visit',
    description: 'A trusted caregiver spends time with your parent at home.',
    icon: 'people-outline',
  },
  {
    id: 'svc-doctor',
    title: 'Doctor Appointment',
    description: 'Support before, during, and after clinic visits.',
    icon: 'clipboard-outline',
  },
  {
    id: 'svc-diagnostic',
    title: 'Diagnostic Assistance',
    description: 'Help with lab tests, scans, and collecting reports.',
    icon: 'flask-outline',
  },
  {
    id: 'svc-medicine',
    title: 'Medicine Coordination',
    description: 'Reminders, organisation, and prescription follow-through.',
    icon: 'file-tray-outline',
  },
  {
    id: 'svc-transport',
    title: 'Transportation',
    description: 'Safe, accompanied travel to appointments and errands.',
    icon: 'car-outline',
  },
  {
    id: 'svc-safety',
    title: 'Home Safety Assessment',
    description: 'A calm review of the home to reduce everyday risks.',
    icon: 'home-outline',
  },
  {
    id: 'svc-digital',
    title: 'Digital Assistance',
    description: 'Help with phones, video calls, and simple technology.',
    icon: 'phone-portrait-outline',
  },
  {
    id: 'svc-food',
    title: 'Food Delivery',
    description: 'Hot, nutritious meals delivered to your parent.',
    icon: 'restaurant-outline',
  },
  {
    id: 'svc-grocery',
    title: 'Grocery',
    description: 'Fresh groceries delivered safely.',
    icon: 'cart-outline',
  },
];
