/**
 * Time and duration calculation utilities for Agenda and Clinical modules
 */

/**
 * Convert time string "HH:MM" to total minutes from 00:00
 */
export function timeStrToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convert total minutes to time string "HH:MM"
 */
export function minutesToTimeStr(totalMinutes) {
  const clamped = Math.max(0, Math.min(1439, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = Math.floor(clamped % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculate end time given a start time string "HH:MM" and duration in minutes
 */
export function calculateEndTime(startTime, durationMinutes) {
  const startMin = timeStrToMinutes(startTime);
  return minutesToTimeStr(startMin + (durationMinutes || 0));
}
