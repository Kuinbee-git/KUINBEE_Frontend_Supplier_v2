/**
 * Test Utilities
 * Helper functions for testing the supplier panel
 */

import { SupplierProfile } from "@/store/supplier.store";

/**
 * Create a mock supplier profile for testing
 */
export function createMockSupplierProfile(
  overrides?: Partial<SupplierProfile>
): SupplierProfile {
  return {
    id: "test-supplier-001",
    email: "test@supplier.com",
    supplierType: "company",
    name: "Test Supplier Inc.",
    phone: "+1234567890",
    country: "United States",
    businessDomains: ["Technology & Software"],
    primaryDomain: "Technology & Software",
    kycStatus: "not_started",
    isVerified: false,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a verified supplier profile
 */
export function createVerifiedSupplierProfile(): SupplierProfile {
  return createMockSupplierProfile({
    kycStatus: "verified",
    isVerified: true,
  });
}

/**
 * Create a pending verification supplier profile
 */
export function createPendingSupplierProfile(): SupplierProfile {
  return createMockSupplierProfile({
    kycStatus: "pending",
    isVerified: false,
  });
}

/**
 * Simulate form validation
 */
export function simulateFormValidation<T>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  requiredFields.forEach((field) => {
    if (!data[field]) {
      errors.push(`${String(field)} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Simulate API delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulate API response
 */
export async function simulateApiCall<T>(
  data: T,
  delayMs: number = 1000,
  shouldFail: boolean = false
): Promise<{ success: boolean; data?: T; error?: string }> {
  await delay(delayMs);

  if (shouldFail) {
    return {
      success: false,
      error: "Simulated API error",
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * Test localStorage operations
 */
export function testLocalStorage() {
  const testKey = "test-storage";
  const testValue = { test: "value" };

  try {
    localStorage.setItem(testKey, JSON.stringify(testValue));
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    return {
      isAvailable: true,
      canWrite: !!retrieved,
      canRead: JSON.parse(retrieved || "{}").test === testValue.test,
    };
  } catch (error) {
    return {
      isAvailable: false,
      canWrite: false,
      canRead: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check browser capabilities
 */
export function checkBrowserCapabilities() {
  return {
    localStorage: typeof window !== "undefined" && "localStorage" in window,
    sessionStorage: typeof window !== "undefined" && "sessionStorage" in window,
    webWorkers: typeof Worker !== "undefined",
    serviceWorkers: "serviceWorker" in navigator,
    // notifications: "Notification" in window,
    geolocation: "geolocation" in navigator,
    darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  };
}

/**
 * Format test results for console logging
 */
export function logTestResults(testName: string, results: any) {
  console.group(`🧪 ${testName}`);
  console.table(results);
  console.groupEnd();
}
