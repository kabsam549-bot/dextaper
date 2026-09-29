'use client';

import { useMemo, useState } from 'react';
import { Check, Clipboard } from 'lucide-react';
import type { TaperSchedule, TaperStep } from '@/lib/types';

interface ClinicianNoteProps {
  schedule: TaperSchedule;
}

const frequencyLabel: Record<TaperStep['frequency'], string> = {
  QID: 'four times daily',
  TID: 'three times daily',
  BID: 'twice daily',
  daily: 'once daily',
  QOD: 'every other day',
};

function dailyDose(step: TaperStep) {
  const multiplier: Record<TaperStep['frequency'], number> = {
    QID: 4,
    TID: 3,
    BID: 2,
    daily: 1,
    QOD: 1,
  };
  return step.dose * multiplier[step.frequency];
}

function formatStep(step: TaperStep) {
  const days = `day${step.days === 1 ? '' : 's'}`;
  return `${dailyDose(step)} mg/day (${step.dose} mg ${frequencyLabel[step.frequency]}) for ${step.days} ${days}`;
}

export default function ClinicianNote({ schedule }: ClinicianNoteProps) {
  const [copied, setCopied] = useState(false);

  const note = useMemo(() => {
    const doseSteps = schedule.steps.map((step) => `• ${formatStep(step)}`);
    return [
      ...doseSteps,
      'If symptoms get worse, go back up to the last dose that controlled symptoms, then call us or send us a MyChart message.',
    ].join('\n');
  }, [schedule]);

  async function copyNote() {
    await navigator.clipboard.writeText(note);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 print:hidden">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-700"><Clipboard className="h-4 w-4" /></div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Copyable discharge blurb</h2>
          <p className="mt-1 text-sm text-slate-600">A short taper schedule for a discharge instruction or patient message.</p>
        </div>
      </div>

      <textarea readOnly value={note} aria-label="Copyable discharge blurb" className="mt-4 min-h-40 w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-800 focus:outline-none" />
      <div className="mt-3 flex items-center justify-end gap-3">
        <button type="button" onClick={copyNote} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}{copied ? 'Copied' : 'Copy blurb'}
        </button>
      </div>
    </section>
  );
}
