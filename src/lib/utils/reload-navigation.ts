/**
 * Auth expiry/logout and fatal-error recovery require a new document so cached
 * credentials, query data, and the failed React tree cannot survive navigation.
 */
export function reloadAt(path: "/auth/login" | "/dashboard" | "/" | "/invitation" | "/onboarding/workspace") {
  window.location.assign(new URL(path, window.location.origin).href);
}
