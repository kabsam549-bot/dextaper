import { addDays, format } from 'date-fns';
import type { TaperSchedule, TaperStep, DailyDose, DoseTime, Frequency, PillSize } from './types';

type TimeName = 'Morning' | 'Noon' | 'Evening' | 'Bedtime';

function getTimesForFrequency(frequency: Frequency): TimeName[] {
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
    case 'QOD': return 0.5;
  }
}

function pillLabel(count: number): string {
  if (count === 0.5) return '\u00BD tablet';
  if (count === 1) return '1 tablet';
  if (count % 1 === 0.5) return `${Math.floor(count)}\u00BD tablets`;
  return `${count} tablet${count !== 1 ? 's' : ''}`;
}

function buildInstruction(dose: number, frequency: Frequency, pillSize: PillSize): string {
  const pills = dose / pillSize;
  const pl = pillLabel(pills);
  const mgNote = `(${dose} mg)`;

  if (frequency === 'QOD') {
    return `Take ${pl} ${mgNote} every other day in the morning with food`;
  }

  const times = getTimesForFrequency(frequency);
  const mealMap: Record<string, string> = {
    'Morning': 'with breakfast',
    'Noon': 'with lunch',
    'Evening': 'with dinner',
    'Bedtime': 'at bedtime with a snack',
  };

  if (times.length === 1) {
    return `Take ${pl} ${mgNote} ${mealMap[times[0]]}`;
  }

  const parts = times.map(t => `${pl} ${mealMap[t]}`);
  const last = parts.pop();
  return `Take ${parts.join(', ')} and ${last}`;
}

export function generateSchedule(schedule: TaperSchedule): DailyDose[] {
  const [year, month, day] = schedule.startDate.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);
  const dailyDoses: DailyDose[] = [];
  let currentDay = 0;

  for (const step of schedule.steps) {
    for (let d = 0; d < step.days; d++) {
      const date = addDays(startDate, currentDay);

      if (step.frequency === 'QOD' && d % 2 === 1) {
        dailyDoses.push({
          date,
          dayNumber: currentDay + 1,
          totalDailyMg: 0,
          totalPills: 0,
          instructions: 'No dexamethasone today (every other day dosing)',
          doses: [],
        });
        currentDay++;
        continue;
      }

      const times = getTimesForFrequency(step.frequency);
      const pillsPerDose = step.dose / schedule.pillSize;
      const doses: DoseTime[] = times.map(time => ({
        time,
        mg: step.dose,
        pills: pillsPerDose,
        pillLabel: pillLabel(pillsPerDose),
      }));

      const totalDailyMg = step.frequency === 'QOD'
        ? step.dose
        : step.dose * getFrequencyMultiplier(step.frequency);
      const totalPills = step.frequency === 'QOD'
        ? pillsPerDose
        : pillsPerDose * times.length;

      dailyDoses.push({
        date,
        dayNumber: currentDay + 1,
        totalDailyMg,
        totalPills,
        instructions: buildInstruction(step.dose, step.frequency, schedule.pillSize),
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

export function formatDateShort(date: Date): string {
  return format(date, 'MMM d');
}

export function getTotalDays(steps: TaperStep[]): number {
  return steps.reduce((sum, s) => sum + s.days, 0);
}

export function generateICS(schedule: TaperSchedule): string {
  const dailyDoses = generateSchedule(schedule);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DexTaper//Dexamethasone Taper//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Dexamethasone Taper${schedule.patientName ? ` - ${schedule.patientName}` : ''}`,
  ];

  for (const day of dailyDoses) {
    if (day.doses.length === 0) continue;

    // Morning reminder at 8 AM
    const morningDoses = day.doses.filter(d => d.time === 'Morning' || d.time === 'Noon');
    const eveningDoses = day.doses.filter(d => d.time === 'Evening' || d.time === 'Bedtime');

    const dateStr = format(day.date, 'yyyyMMdd');
    const uid = `dextaper-${dateStr}-${Math.random().toString(36).slice(2, 8)}`;

    if (morningDoses.length > 0) {
      const desc = morningDoses.map(d =>
        `${d.time}: Take ${d.pillLabel} (${d.mg} mg) with food`
      ).join('\\n');

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}-am@dextaper`,
        `DTSTART:${dateStr}T080000`,
        `DTEND:${dateStr}T081500`,
        `SUMMARY:Dexamethasone - ${day.totalDailyMg} mg total today`,
        `DESCRIPTION:${desc}\\n\\nDay ${day.dayNumber} of taper`,
        'BEGIN:VALARM',
        'TRIGGER:-PT5M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Time to take your dexamethasone',
        'END:VALARM',
        'END:VEVENT',
      );
    }

    if (eveningDoses.length > 0) {
      const desc = eveningDoses.map(d =>
        `${d.time}: Take ${d.pillLabel} (${d.mg} mg) with food`
      ).join('\\n');

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}-pm@dextaper`,
        `DTSTART:${dateStr}T180000`,
        `DTEND:${dateStr}T181500`,
        `SUMMARY:Dexamethasone - Evening dose`,
        `DESCRIPTION:${desc}\\n\\nDay ${day.dayNumber} of taper`,
        'BEGIN:VALARM',
        'TRIGGER:-PT5M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Time to take your evening dexamethasone',
        'END:VALARM',
        'END:VEVENT',
      );
    }
  }

  // Add completion event
  const lastDay = dailyDoses[dailyDoses.length - 1];
  if (lastDay) {
    const doneDate = addDays(lastDay.date, 1);
    const doneDateStr = format(doneDate, 'yyyyMMdd');
    lines.push(
      'BEGIN:VEVENT',
      `UID:dextaper-done-${doneDateStr}@dextaper`,
      `DTSTART;VALUE=DATE:${doneDateStr}`,
      `DTEND;VALUE=DATE:${doneDateStr}`,
      `SUMMARY:Dexamethasone taper complete!`,
      `DESCRIPTION:Your steroid taper is finished. Contact your doctor if you experience any symptoms.`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
