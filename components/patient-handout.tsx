'use client';

import { forwardRef } from 'react';
import type { TaperSchedule, DailyDose } from '@/lib/types';
import { generateSchedule, formatDate } from '@/lib/taper-engine';
import { format } from 'date-fns';

interface PatientHandoutProps {
  schedule: TaperSchedule;
}

function getDoseColor(totalMg: number, maxMg: number): string {
  if (totalMg === 0) return 'bg-gray-50 border-gray-200';
  const ratio = totalMg / maxMg;
  if (ratio > 0.75) return 'bg-blue-100 border-blue-300';
  if (ratio > 0.5) return 'bg-blue-50 border-blue-200';
  if (ratio > 0.25) return 'bg-sky-50 border-sky-200';
  return 'bg-slate-50 border-slate-200';
}

function getDoseBadgeColor(totalMg: number, maxMg: number): string {
  if (totalMg === 0) return 'bg-gray-200 text-gray-600';
  const ratio = totalMg / maxMg;
  if (ratio > 0.75) return 'bg-blue-600 text-white';
  if (ratio > 0.5) return 'bg-blue-500 text-white';
  if (ratio > 0.25) return 'bg-blue-400 text-white';
  return 'bg-blue-300 text-white';
}

const PatientHandout = forwardRef<HTMLDivElement, PatientHandoutProps>(
  function PatientHandout({ schedule }, ref) {
    const dailyDoses = generateSchedule(schedule);
    const maxMg = Math.max(...dailyDoses.map(d => d.totalDailyMg));

    return (
      <div ref={ref} className="bg-white text-gray-900" id="patient-handout">
        {/* Header */}
        <div className="border-b-2 border-blue-600 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-blue-900">
            Dexamethasone Taper Instructions
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            {schedule.patientName && (
              <span><strong>Patient:</strong> {schedule.patientName}</span>
            )}
            <span><strong>Start Date:</strong> {format(new Date(schedule.startDate), 'MMMM d, yyyy')}</span>
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
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Your Daily Schedule</h2>
          <div className="grid grid-cols-1 gap-2">
            {dailyDoses.map((day, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${getDoseColor(day.totalDailyMg, maxMg)}`}
              >
                <div className="shrink-0 w-28">
                  <div className="text-sm font-semibold text-gray-800">
                    {formatDate(day.date)}
                  </div>
                  <div className="text-xs text-gray-500">Day {day.dayNumber}</div>
                </div>
                <div className="shrink-0">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${getDoseBadgeColor(day.totalDailyMg, maxMg)}`}>
                    {day.totalDailyMg} mg
                  </span>
                </div>
                <div className="flex-1">
                  {day.doses.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {day.doses.map((dose, j) => (
                        <span key={j} className="text-sm text-gray-700">
                          <span className="font-medium">{dose.time}:</span> {dose.mg} mg
                          {j < day.doses.length - 1 && <span className="ml-2 text-gray-300">|</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 italic">{day.instructions}</span>
                  )}
                </div>
              </div>
            ))}
            {/* STOP row */}
            <div className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-4 py-3">
              <div className="shrink-0 w-28">
                <div className="text-sm font-semibold text-green-800">
                  {dailyDoses.length > 0 && formatDate(
                    new Date(new Date(dailyDoses[dailyDoses.length - 1].date).getTime() + 86400000)
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <span className="inline-block rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  DONE
                </span>
              </div>
              <div className="flex-1 text-sm font-medium text-green-800">
                Stop dexamethasone — taper complete
              </div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-5 mb-6">
          <h2 className="text-lg font-bold text-amber-900 mb-3">
            Important Information
          </h2>
          <div className="space-y-3 text-sm text-amber-950">
            <div>
              <h3 className="font-semibold">How to Take</h3>
              <ul className="mt-1 list-disc list-inside space-y-0.5">
                <li><strong>Always take with food</strong> to prevent stomach upset</li>
                <li>Take morning doses with breakfast, evening doses with dinner</li>
                <li><strong>Do NOT stop suddenly</strong> — follow this schedule exactly as written</li>
                <li>If you miss a dose, take it as soon as you remember. If it is almost time for your next dose, skip the missed dose and continue your regular schedule</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Common Side Effects</h3>
              <ul className="mt-1 list-disc list-inside space-y-0.5">
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
        <div className="rounded-lg border-2 border-red-300 bg-red-50 p-5 mb-6">
          <h2 className="text-lg font-bold text-red-900 mb-2">
            Call Your Doctor If You Experience
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-950">
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
            <p className="mt-3 text-sm font-semibold text-red-900">
              Contact: {schedule.providerName ? `${schedule.providerName} — ` : ''}{schedule.providerPhone}
            </p>
          )}
          <p className="mt-1 text-sm text-red-800">
            For emergencies, call 911 or go to the nearest emergency room.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-3 text-xs text-gray-400 text-center">
          Generated on {format(new Date(), 'MMMM d, yyyy')} • DexTaper
        </div>
      </div>
    );
  }
);

export default PatientHandout;
