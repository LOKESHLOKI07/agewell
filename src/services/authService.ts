import { mockUser, MOCK_OTP } from '@/mock/users';
import type { User } from '@/types';
import { delay } from '@/utils/delay';

export async function requestOtp(phone: string): Promise<{ phone: string }> {
  await delay(350);
  return { phone };
}

export async function verifyOtp(phone: string, otp: string): Promise<User> {
  await delay(400);
  if (otp !== MOCK_OTP) {
    throw new Error('That code is incorrect. For this prototype, use 123456.');
  }
  return {
    ...mockUser,
    phone: phone.length === 10 ? `+91 ${phone}` : mockUser.phone,
  };
}
