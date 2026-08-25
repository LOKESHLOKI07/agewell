export type AuthStatus = 'INITIALIZING' | 'UNAUTHENTICATED' | 'AUTHENTICATED';

export type AuthRole = 'SENIOR' | 'FAMILY' | 'CARE_MANAGER' | 'ADMIN' | 'OPERATIONS';

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'DISABLED';

export const AUTH_ROLES: readonly AuthRole[] = [
  'SENIOR',
  'FAMILY',
  'CARE_MANAGER',
  'ADMIN',
  'OPERATIONS',
] as const;

export const AUTH_ROLE_LABELS: Record<AuthRole, string> = {
  SENIOR: 'Senior',
  FAMILY: 'Family member',
  CARE_MANAGER: 'Care manager',
  ADMIN: 'Admin',
  OPERATIONS: 'Operations',
};

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Matches FastAPI TokenResponse. */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/** Matches FastAPI RefreshRequest. */
export interface RefreshRequest {
  refresh_token: string;
}

/**
 * Safe current-user profile.
 * Matches FastAPI UserResponse fields only — never hashed_password or tokens.
 */
export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  role: AuthRole;
  accountStatus: AccountStatus;
  createdAt: string;
}

export function isAuthRole(value: unknown): value is AuthRole {
  return typeof value === 'string' && (AUTH_ROLES as readonly string[]).includes(value);
}

function isAccountStatus(value: unknown): value is AccountStatus {
  return value === 'PENDING' || value === 'ACTIVE' || value === 'REJECTED' || value === 'DISABLED';
}

export function toAuthUser(payload: unknown): AuthUser {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid user profile');
  }

  const data = payload as Record<string, unknown>;

  if (typeof data.id !== 'string' && typeof data.id !== 'number') {
    throw new Error('Invalid user profile');
  }
  if (typeof data.email !== 'string' || typeof data.phone !== 'string') {
    throw new Error('Invalid user profile');
  }
  if (!isAuthRole(data.role)) {
    throw new Error('Invalid user profile');
  }

  const createdAt = data.created_at;
  if (typeof createdAt !== 'string') {
    throw new Error('Invalid user profile');
  }

  const accountStatus = data.account_status;
  const resolvedStatus: AccountStatus = isAccountStatus(accountStatus) ? accountStatus : 'ACTIVE';

  return {
    id: String(data.id),
    email: data.email,
    phone: data.phone,
    role: data.role,
    accountStatus: resolvedStatus,
    createdAt,
  };
}
