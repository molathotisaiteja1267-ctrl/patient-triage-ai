/**
 * Centralized Clinical Date & Time Utility for PatientTriage.ai
 * Prevents invalid dates, empty string submissions, and ensures consistent EHR formatting.
 */

/**
 * Safely parse any date value into a valid JS Date object or null.
 */
export function parseDateSafely(val: any): Date | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  try {
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Check whether a string represents a valid parseable date.
 */
export function isValidDateString(val?: string | null): boolean {
  if (!val || typeof val !== 'string' || val.trim() === '') return false;
  const d = parseDateSafely(val);
  return d !== null;
}

/**
 * Format date for display in EHR views (e.g. "18 Aug 2026").
 * Returns fallback if date is missing or invalid. Never outputs "Invalid Date", "NaN", or "undefined".
 */
export function formatDateForDisplay(val: any, fallback = 'Not recorded'): string {
  const d = parseDateSafely(val);
  if (!d) return fallback;

  try {
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return fallback;
  }
}

/**
 * Format datetime for display in clinical logs (e.g. "18 Aug 2026, 10:42 AM").
 */
export function formatDateTimeForDisplay(val: any, fallback = 'Not recorded'): string {
  const d = parseDateSafely(val);
  if (!d) return fallback;

  try {
    const datePart = d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart}, ${timePart}`;
  } catch {
    return fallback;
  }
}

/**
 * Format time for display (e.g. "10:42 AM").
 */
export function formatTimeForDisplay(val: any, fallback = 'Not recorded'): string {
  if (typeof val === 'string' && /^\d{1,2}:\d{2}\s*(AM|PM)?$/i.test(val.trim())) {
    return val.trim();
  }
  const d = parseDateSafely(val);
  if (!d) return fallback;

  try {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return fallback;
  }
}

/**
 * Normalize date into standard YYYY-MM-DD for API requests.
 * Returns null if input is invalid or empty (never sends empty string "").
 */
export function formatDateForAPI(val?: any): string | null {
  const d = parseDateSafely(val);
  if (!d) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalize datetime into ISO 8601 string for API requests.
 * Returns null if input is invalid or empty (never sends empty string "").
 */
export function formatDateTimeForAPI(val?: any): string | null {
  const d = parseDateSafely(val);
  if (!d) return null;
  return d.toISOString();
}

/**
 * Get today's local date as YYYY-MM-DD string (for date inputs min/default).
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current formatted time string (e.g. "10:42 AM").
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Calculate age in years accurately from Date of Birth string (YYYY-MM-DD).
 */
export function calculateAgeFromDob(dob: string): number | null {
  const birth = parseDateSafely(dob);
  if (!birth) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}
