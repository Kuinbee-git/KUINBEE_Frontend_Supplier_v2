/**
 * Centralized error message handler
 * Provides user-friendly error messages for various error scenarios
 */

export interface ErrorResponse {
  code?: string;
  message?: string;
  status?: number;
  data?: any;
}

/**
 * Get a user-friendly error message based on error type and code
 */
export const getErrorMessage = (error: any): string => {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Extract error details
  const errorCode = error?.data?.code || error?.code;
  const errorMessage = error?.message || '';
  const status = error?.status;

  // Network/Connectivity errors
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (errorMessage.includes('timeout') || errorCode === 'TIMEOUT') {
    return 'The request took too long. Please check your internet connection and try again.';
  }

  if (status === 0 || navigator?.onLine === false) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }

  // Server error messages
  const networkErrorMessages: Record<string, string> = {
    'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection and try again.',
    'CONNECTION_TIMEOUT': 'The request took too long to complete. Please check your internet connection and try again.',
    'OFFLINE': 'You appear to be offline. Please verify your internet connection.',
    'SERVER_ERROR': 'The server encountered an error. Please try again in a moment.',
  };

  if (errorCode && networkErrorMessages[errorCode]) {
    return networkErrorMessages[errorCode];
  }

  // HTTP Status codes
  if (status === 503 || status === 502) {
    return 'The server is temporarily unavailable. Please try again in a few moments.';
  }

  if (status === 504) {
    return 'The request timed out. Please check your internet connection and try again.';
  }

  if (status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (status === 404) {
    return 'The requested resource was not found.';
  }

  // Return original message if available, or generic message
  return errorMessage || 'An unexpected error occurred. Please try again.';
};

/**
 * Check if error is a connectivity issue
 */
export const isConnectivityError = (error: any): boolean => {
  if (!error) return false;

  const message = error?.message || '';
  const code = error?.code || error?.data?.code;
  const status = error?.status;

  return (
    message.includes('Failed to fetch') ||
    message.includes('Network') ||
    code === 'NETWORK_ERROR' ||
    code === 'TIMEOUT' ||
    status === 0 ||
    navigator?.onLine === false
  );
};

/**
 * Suggest retry action based on error type
 */
export const getRetryAdvice = (error: any): string => {
  if (isConnectivityError(error)) {
    return 'Check your internet connection and try again.';
  }
  return 'Please try again or contact support if the problem persists.';
};
