let resetEmail = '';
let resetToken = '';

export function setPasswordResetSession(email: string, token: string) {
  resetEmail = email.trim().toLowerCase();
  resetToken = token.trim();
}

export function getPasswordResetSession(): { email: string; resetToken: string } | null {
  if (!resetEmail || !resetToken) {
    return null;
  }
  return { email: resetEmail, resetToken };
}

export function clearPasswordResetSession() {
  resetEmail = '';
  resetToken = '';
}
