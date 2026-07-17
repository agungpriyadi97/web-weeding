import { WeddingEvent } from '@/types/wedding';

export type EventStatus = 'Upcoming' | 'Today' | 'Finished';

/**
 * Calculates the status of a wedding event based on current time in Asia/Jakarta (UTC+7).
 */
export function getEventStatus(event: WeddingEvent): EventStatus {
  if (!event.event_date) return 'Upcoming';

  // Parse event date (YYYY-MM-DD)
  const dateParts = event.event_date.split('T')[0].split('-');
  if (dateParts.length !== 3) return 'Upcoming';
  
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10);
  const day = parseInt(dateParts[2], 10);

  // Extract times from event_time string, e.g. "09:00 - 11:00 WIB"
  const timeRegex = /(\d{2})[:.](\d{2})/g;
  const matches = [...event.event_time.matchAll(timeRegex)];

  let startHour = 8;
  let startMinute = 0;
  let endHour = 23;
  let endMinute = 59;

  if (matches.length >= 1) {
    startHour = parseInt(matches[0][1], 10);
    startMinute = parseInt(matches[0][2], 10);
    
    // Default duration: 4 hours
    endHour = startHour + 4;
    endMinute = startMinute;
    if (endHour >= 24) {
      endHour = 23;
      endMinute = 59;
    }
  }

  if (matches.length >= 2) {
    endHour = parseInt(matches[1][1], 10);
    endMinute = parseInt(matches[1][2], 10);
  }

  // Construct dates using specific +07:00 Jakarta offset
  const pad = (n: number) => String(n).padStart(2, '0');
  const startDate = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(startHour)}:${pad(startMinute)}:00+07:00`);
  const endDate = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(endHour)}:${pad(endMinute)}:00+07:00`);

  const now = new Date();

  if (now.getTime() < startDate.getTime()) {
    return 'Upcoming';
  } else if (now.getTime() > endDate.getTime()) {
    return 'Finished';
  } else {
    return 'Today';
  }
}

/**
 * Returns the first chronological event that is not finished yet.
 */
export function getNextEvent(events: WeddingEvent[]): WeddingEvent | null {
  if (!events || events.length === 0) return null;

  const sorted = [...events].sort((a, b) => {
    const aTime = new Date(a.event_date).getTime();
    const bTime = new Date(b.event_date).getTime();
    return aTime - bTime;
  });

  const next = sorted.find(ev => getEventStatus(ev) !== 'Finished');
  return next || null;
}

/**
 * Extracts and formats the target start date-time in standard ISO form with Jakarta offset (+07:00).
 */
export function getEventStartIsoString(event: WeddingEvent): string {
  const dateParts = event.event_date.split('T')[0].split('-');
  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];

  const timeRegex = /(\d{2})[:.](\d{2})/;
  const match = event.event_time.match(timeRegex);
  const hour = match ? match[1] : '08';
  const minute = match ? match[2] : '00';

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00+07:00`;
}
