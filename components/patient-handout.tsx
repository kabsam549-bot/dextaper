'use client';

import { forwardRef } from 'react';
import { Sun, Moon, Sunrise, CloudSun } from 'lucide-react';
import type { TaperSchedule, DoseTime } from '@/lib/types';
import { generateSchedule, formatDate } from '@/lib/taper-engine';
import { format } from 'date-fns';

interface PatientHandoutProps {
  schedule: TaperSchedule;
}

function getDoseColor(totalMg: number, maxMg: number): string {
  if (totalMg === 0) return 'bg-gray-50 border-gray-200';
  const ratio = totalMg / maxMg;
  if (ratio > 0.75) return 'bg-blue-50 border-blue-200';
  if (ratio > 0.5) return 'bg-sky-50 border-sky-200';
  if (ratio > 0.25) return 'bg-slate-50 border-slate-200';
  return 'bg-gray-50 border-gray-200';
}

function getDoseBadgeColor(totalMg: number, maxMg: number): string {
  if (totalMg === 0) return 'bg-gray-200 text-gray-600';
  const ratio = totalMg / maxMg;
  if (ratio > 0.75) return 'bg-blue-600 text-white';
  if (ratio > 0.5) return 'bg-blue-500 text-white';
  if (ratio > 0.25) return 'bg-blue-400 text-white';
  return 'bg-blue-300 text-white';
}

function isAM(time: string): boolean {
  return time === 'Morning' || time === 'Noon';
}

function TimeIcon({ time, className }: { time: string; className?: string }) {
  const cn = className || 'h-3.5 w-3.5';
  switch (time) {
    case 'Morning': return <Sunrise className={`${cn} text-amber-500`} />;
    case 'Noon': return <Sun className={`${cn} text-yellow-500`} />;
    case 'Evening': return <CloudSun className={`${cn} text-orange-500`} />;
    case 'Bedtime': return <Moon className={`${cn} text-indigo-500`} />;
    default: return null;
  }
}

function mealFor(time: string): string {
  switch (time) {
    case 'Morning': return 'with breakfast';
    case 'Noon': return 'with lunch';
    case 'Evening': return 'with dinner';
    case 'Bedtime': return 'with a snack';
    default: return '';
  }
}

function DosePill({ dose, pillSize }: { dose: DoseTime; pillSize: number }) {
  const bgClass = isAM(dose.time)
    ? 'bg-amber-50 border-amber-200'
    : 'bg-indigo-50 border-indigo-200';
  const textClass = isAM(dose.time) ? 'text-amber-900' : 'text-indigo-900';
  const subClass = isAM(dose.time) ? 'text-amber-700' : 'text-indigo-700';

  return (
    <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${bgClass}`}>
      <TimeIcon time={dose.time} />
      <div className="min-w-0">
        <div className={`text-sm font-semibold leading-tight ${textClass}`}>
          {dose.pillLabel}
        </div>
        <div className={`text-xs leading-tight ${subClass}`}>
          {dose.mg} mg {mealFor(dose.time)}
        </div>
      </div>
    </div>
  );
}

const PatientHandout = forwardRef<HTMLDivElement, PatientHandoutProps>(
  function PatientHandout({ schedule }, ref) {
    const dailyDoses = generateSchedule(schedule);
    const maxMg = Math.max(...dailyDoses.map(d => d.totalDailyMg));

    return (
      <div ref={ref} className="bg-white text-gray-900" id="patient-handout">
        {/* Header */}
        <div className="border-b-2 border-blue-600 pb-4 mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-900">
            Dexamethasone Taper Instructions
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Pill strength: {schedule.pillSize} mg tablets
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {schedule.patientName && (
              <span><strong>Patient:</strong> {schedule.patientName}</span>
            )}
            <span><strong>Start:</strong> {(() => { const [y,m,d] = schedule.startDate.split('-').map(Number); return format(new Date(y, m-1, d), 'MMMM d, yyyy'); })()}</span>
            <span><strong>Indication:</strong> {schedule.indication}</span>
          </div>
          {(schedule.providerName || schedule.providerPhone) && (
            <div className="mt-1 text-sm text-gray-600">
              {schedule.providerName && <span><strong>Provider:</strong> {schedule.providerName}</span>}
              {schedule.providerPhone && <span className="ml-4"><strong>Phone:</strong> {schedule.providerPhone}</span>}
            </div>
          )}
        </div>

        {/* Daily Schedule */}
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-800 mb-2">Your Daily Schedule</h2>
          <div className="space-y-1.5">
            {dailyDoses.map((day, i) => (
              <div
                key={i}
                className={`rounded-lg border px-3 py-2.5 ${getDoseColor(day.totalDailyMg, maxMg)}`}
              >
                {/* Date row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">
                      {formatDate(day.date)}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">Day {day.dayNumber}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${getDoseBadgeColor(day.totalDailyMg, maxMg)}`}>
                    {day.totalDailyMg} mg
                  </span>
                </div>

                {/* Dose cards */}
                {day.doses.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {day.doses.map((dose, j) => (
                      <DosePill key={j} dose={dose} pillSize={schedule.pillSize} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">{day.instructions}</p>
                )}
              </div>
            ))}
            {/* DONE row */}
            <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-green-800">
                  {dailyDoses.length > 0 && formatDate(
                    new Date(dailyDoses[dailyDoses.length - 1].date.getTime() + 86400000)
                  )}
                </span>
                <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                  DONE
                </span>
              </div>
              <p className="text-sm font-medium text-green-800 mt-0.5">
                Stop dexamethasone — taper complete
              </p>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 mb-4">
          <h2 className="text-base font-bold text-amber-900 mb-2">
            Important Information
          </h2>
          <div className="space-y-2.5 text-sm text-amber-950">
            <div>
              <h3 className="font-semibold text-sm">How to Take Your Medication</h3>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-[13px]">
                <li><strong>Always take with food</strong> to prevent stomach upset</li>
                <li>You are taking <strong>{schedule.pillSize} mg tablets</strong> of dexamethasone</li>
                <li>Take morning doses with breakfast, evening doses with dinner</li>
                <li><strong>Do NOT stop suddenly</strong> — follow this schedule exactly as written</li>
                <li>If you miss a dose, take it as soon as you remember. If it is almost time for your next dose, skip the missed dose</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Common Side Effects</h3>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-[13px]">
                <li>Trouble sleeping — try taking last dose no later than dinner</li>
                <li>Increased appetite and weight gain</li>
                <li>Mood changes (irritability, restlessness)</li>
                <li>Elevated blood sugar — <strong>check blood sugar regularly if diabetic</strong></li>
                <li>Stomach upset or heartburn</li>
              </ul>
            </div>
          </div>
        </div>

        {/* When to Call */}
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 mb-4">
          <h2 className="text-base font-bold text-red-900 mb-1.5">
            Call Your Doctor If You Experience
          </h2>
          <ul className="list-disc list-inside space-y-0.5 text-[13px] text-red-950">
            <li>Severe or worsening headache</li>
            <li>New vision changes or difficulty speaking</li>
            <li>Persistent nausea or vomiting</li>
            <li>Fever or signs of infection</li>
            <li>Extreme weakness, dizziness, or fainting</li>
            <li>Blood sugar consistently above 300 mg/dL</li>
            <li>Black or tarry stools</li>
            <li>Severe mood changes or confusion</li>
            <li>New or worsening seizures</li>
          </ul>
          {schedule.providerPhone && (
            <p className="mt-2 text-sm font-semibold text-red-900">
              Contact: {schedule.providerName ? `${schedule.providerName} — ` : ''}{schedule.providerPhone}
            </p>
          )}
          <p className="mt-1 text-[13px] text-red-800">
            For emergencies, call 911 or go to the nearest emergency room.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-2 text-xs text-gray-400 text-center">
          Generated on {format(new Date(), 'MMMM d, yyyy')} • DexTaper
        </div>
      </div>
    );
  }
);

export default PatientHandout;
