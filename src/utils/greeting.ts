import { joinPersonName } from '@/utils/personName';

export function getGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function fullName(firstName: string, lastName: string): string {
  return joinPersonName(firstName, lastName);
}
