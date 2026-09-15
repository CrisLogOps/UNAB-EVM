import { formatClp } from "./evm";

/** Piso mensual por persona, desde que se crea el usuario. */
export const MONTHLY_FLOOR_CLP = 1_000_000;

/** Horas de capacitación y prueba por persona. */
export const TRAINING_HOURS = 30;

/** Ritmo diario de la inducción. */
export const TRAINING_HOURS_PER_DAY = 2;

export function countProjectMonths(startDate: string, finishDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const finish = new Date(`${finishDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(finish.getTime()) || finish <= start) {
    return 1;
  }
  const days = Math.max(1, Math.round((finish.getTime() - start.getTime()) / 86_400_000));
  return Math.max(1, Math.round(days / 30));
}

export function trainingDays(): number {
  return Math.ceil(TRAINING_HOURS / TRAINING_HOURS_PER_DAY);
}

export function costPerPersonClp(months: number): number {
  return MONTHLY_FLOOR_CLP * Math.max(1, months);
}

export function staffingEstimate(startDate: string, finishDate: string, memberCount: number) {
  const months = countProjectMonths(startDate, finishDate);
  const people = Math.max(1, memberCount);
  const perPerson = costPerPersonClp(months);
  const totalClp = perPerson * people;
  return {
    months,
    people,
    perPerson,
    totalClp,
    trainingHours: TRAINING_HOURS,
    hoursPerDay: TRAINING_HOURS_PER_DAY,
    trainingDays: trainingDays(),
    note: `Inducción ${months} mes${months === 1 ? "" : "es"} · ${people} persona${people === 1 ? "" : "s"} · ${formatClp(MONTHLY_FLOOR_CLP)}/mes c/u · ${TRAINING_HOURS} h a ${TRAINING_HOURS_PER_DAY} h/día.`,
  };
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
