import { DaySchedule } from '../store/useStore';

export const checkStoreOpen = (schedule: Record<number, DaySchedule>): { isOpen: boolean, message: string } => {
  const now = new Date();
  const day = now.getDay();
  const time = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

  const todaySchedule = schedule[day];
  
  if (!todaySchedule || !todaySchedule.isOpen) {
    return { isOpen: false, message: 'Fechado hoje. Aceitando agendamentos.' };
  }

  const parseTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const openMinutes = parseTime(todaySchedule.openTime);
  let closeMinutes = parseTime(todaySchedule.closeTime);

  // Handle midnight crossing like 23:59 or 02:00
  if (closeMinutes < openMinutes) {
    closeMinutes += 24 * 60;
  }

  const nowMinutes = time;
  // If we're past midnight but before close time, we need to adjust today's check
  // E.g. open 18:00, close 02:00. Time is 01:00.
  // This is tricky, simplified logic:
  
  // If close time is next day, check if current time is before close time
  if (nowMinutes >= openMinutes && nowMinutes <= closeMinutes) {
    return { isOpen: true, message: '' };
  }

  // Check if we are in the "next day" early morning part
  if (closeMinutes > 24 * 60) {
    const nextDayMinutes = nowMinutes + 24 * 60;
    if (nextDayMinutes >= openMinutes && nextDayMinutes <= closeMinutes) {
      return { isOpen: true, message: '' };
    }
  }

  return { isOpen: false, message: `Abre às ${todaySchedule.openTime}` };
};