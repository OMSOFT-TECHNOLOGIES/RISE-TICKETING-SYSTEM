export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_STRENGTH_REGEX = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export function validatePasswordStrength(password: string): string | null {
  if (!password.trim()) {
    return 'Password is required';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!PASSWORD_STRENGTH_REGEX.test(password)) {
    return 'Password must contain uppercase, lowercase, and number';
  }
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword.trim()) {
    return 'Please confirm the password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return Boolean(
    password.trim() &&
      confirmPassword.trim() &&
      password === confirmPassword
  );
}

export function passwordConfirmMismatch(password: string, confirmPassword: string): boolean {
  return Boolean(confirmPassword.length > 0 && password !== confirmPassword);
}
