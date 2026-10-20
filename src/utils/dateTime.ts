/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a Date object in Asia/Jakarta timezone matching yyyy-MM-dd HH:mm:ss
 */
export function formatJakartaFullDateTime(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Returns date in Asia/Jakarta timezone formatted as yyyy-MM-dd
 */
export function getJakartaDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Returns time in Asia/Jakarta timezone formatted as HH:mm:ss
 */
export function getJakartaTimeString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}

/**
 * Calculates days remaining from today (Asia/Jakarta timezone) to target date
 */
export function getDaysRemainingJakarta(targetDateStr: string, referenceDateStr?: string): number {
  const todayStr = referenceDateStr || getJakartaDateString();
  const target = new Date(`${targetDateStr}T00:00:00+07:00`);
  const ref = new Date(`${todayStr}T00:00:00+07:00`);
  const diffTime = target.getTime() - ref.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the next maintenance date based on frequency from a start date
 */
export function calculateNextJakartaMaintenanceDate(
  startDateStr: string,
  frequency: string
): string {
  const base = new Date(`${startDateStr}T00:00:00+07:00`);
  if (isNaN(base.getTime())) return startDateStr;

  const next = new Date(base);
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'biannually':
      next.setMonth(next.getMonth() + 6);
      break;
    case 'annually':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return getJakartaDateString(next);
}
