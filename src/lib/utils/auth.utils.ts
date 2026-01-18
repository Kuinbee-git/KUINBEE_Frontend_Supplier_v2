/**
 * Auth Utility Functions
 */

/**
 * Mask email for display (e.g., jo***@company.com)
 * Used in verification and security screens
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  
  const visibleChars = Math.min(2, Math.floor(localPart.length / 3));
  const masked = localPart.substring(0, visibleChars) + '***';
  return `${masked}@${domain}`;
}

/**
 * Simple email validation
 */
export function validateEmail(email: string): string {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Enter a valid email address';
  return '';
}

/**
 * Password strength validation
 */
export function getPasswordStrength(password: string): {
  text: string;
  color: string;
} | null {
  if (!password) return null;
  
  const hasLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  
  if (!hasLength) {
    return { text: 'Too short', color: '#ef4444' };
  }
  if (hasLength && hasLetters && hasNumbers) {
    return { text: 'Strong', color: '#10b981' };
  }
  return { text: 'Fair', color: '#f59e0b' };
}

/**
 * Validate password match
 */
export function validatePasswords(
  password: string,
  confirmPassword: string
): string {
  if (!password) return 'Password is required';
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return '';
}
