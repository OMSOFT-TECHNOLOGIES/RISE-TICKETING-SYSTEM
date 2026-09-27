import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  passwordConfirmMismatch,
  passwordsMatch,
  validatePasswordStrength,
} from '../utils/passwordValidation';

type PasswordConfirmFeedbackProps = {
  password: string;
  confirmPassword: string;
  className?: string;
};

/** Live hint under password + confirm fields (mismatch or match). */
export function PasswordConfirmFeedback({
  password,
  confirmPassword,
  className = '',
}: PasswordConfirmFeedbackProps) {
  if (!confirmPassword.trim()) {
    return null;
  }

  if (passwordConfirmMismatch(password, confirmPassword)) {
    return (
      <p
        className={`text-sm text-destructive flex items-center gap-1.5 ${className}`}
        role="alert"
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        Passwords do not match
      </p>
    );
  }

  const strengthError = validatePasswordStrength(password);
  if (passwordsMatch(password, confirmPassword) && !strengthError) {
    return (
      <p className={`text-sm text-green-700 flex items-center gap-1.5 ${className}`}>
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        Passwords match
      </p>
    );
  }

  return null;
}
