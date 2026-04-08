import { addDays, format } from 'date-fns';
import type { TaperSchedule, TaperStep, DailyDose, DoseTime, Frequency } from './types';

function getTimesForFrequency(frequency: Frequency): string[] {
  switch (frequency) {
    case 'QID': return ['Morning', 'Noon', 'Evening', 'Bedtime'];
    case 'TID': return ['Morning', 'Noon', 'Evening'];
    case 'BID': return ['Morning', 'Evening'];
    case 'daily': return ['Morning'];
    case 'QOD': return ['Morning'];
  }
}

function getFrequencyMultiplier(frequency: Frequency): number {
  switch (frequency) {
    case 'QID': return 4;
    case 'TID': return 3;
    case 'BID': return 2;
    case 'daily': return 1;
    case 'QOD': return 0.5; // average per day
  }
}

function buildInstruction(dose: number, frequency: Frequency): string {
  const times = getTimesForFrequency(frequency);
  if (frequency === 'QOD') {
    return `Take ${dose} mg in the morning every other day`;
  }
  if (times.length === 1) {
    return `Take ${dose} mg in the morning with food`;
  }
  const timeLabels = times.map(t => t.toLowerCase());
  const last = timeLabels.pop();
  return `Take ${dose} mg with food in the ${timeLabels.join(', ')} and ${last}`;
}

export function generateSchedule(schedule: TaperSchedule): DailyDose[] {
  const startDate = new Date(schedule.startDate);
  const dailyDoses: DailyDose[] = [];
  let currentDay = 0;

  for (const step of schedule.steps) {
    for (let d = 0; d < step.days; d++) {
      const date = addDays(startDate, currentDay);

      // For QOD, only dose on odd days
      if (step.frequency === 'QOD' && d % 2 === 1) {
        dailyDoses.push({
          date,
          dayNumber: currentDay + 1,
          totalDailyMg: 0,
          instructions: 'No dexamethasone today (every other day dosing)',
          doses: [],
        });
        currentDay++;
        continue;
      }

      const times = getTimesForFrequency(step.frequency);
      const doses: DoseTime[] = times.map(time => ({
        time,
        mg: step.dose,
      }));

      const totalDailyMg = step.frequency === 'QOD'
        ? step.dose
        : step.dose * getFrequencyMultiplier(step.frequency);

      dailyDoses.push({
        date,
        dayNumber: currentDay + 1,
        totalDailyMg,
        instructions: buildInstruction(step.dose, step.frequency),
        doses,
      });

      currentDay++;
    }
  }

  return dailyDoses;
}

export function formatDate(date: Date): string {
  return format(date, 'EEE, MMM d');
}

export function getTotalDays(steps: TaperStep[]): number {
  return steps.reduce((sum, s) => sum + s.days, 0);
}
