import type { EmergencyCase } from '@/types';
import { delay } from '@/utils/delay';

export async function requestEmergencyAssistance(seniorId: string): Promise<EmergencyCase> {
  await delay(450);
  return {
    id: `emergency-${Date.now()}`,
    seniorId,
    status: 'coordinating',
    createdAt: new Date().toISOString(),
    message: 'EldCare Emergency Team Notified',
  };
}
