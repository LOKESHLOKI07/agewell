import type { AuthRole } from './authTypes';
import type { Href } from 'expo-router';

/** Builds the post-registration success route. Caller must already be authenticated. */
export function registrationSuccessHref(input: {
  email: string;
  role: AuthRole;
  message?: string;
  careStatus?: string | null;
}): Href {
  return {
    pathname: '/registration-success',
    params: {
      email: input.email,
      role: input.role,
      ...(input.message ? { message: input.message } : {}),
      ...(input.careStatus ? { careStatus: input.careStatus } : {}),
    },
  } as unknown as Href;
}
