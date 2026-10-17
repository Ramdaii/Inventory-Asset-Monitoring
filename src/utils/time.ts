/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

/**
 * Formats a Date object in Asia/Jakarta timezone matching:
 * yyyy-MM-dd HH:mm:ss
 */
export const formatJakartaRealtime = (date: Date = new Date()): string => {
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
};

/**
 * React hook that provides live-updating real-time string in Asia/Jakarta timezone:
 * yyyy-MM-dd HH:mm:ss
 */
export const useRealtimeJakarta = (): string => {
  const [time, setTime] = useState<string>(() => formatJakartaRealtime());

  useEffect(() => {
    const update = () => setTime(formatJakartaRealtime());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
};
