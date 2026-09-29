'use client';

import { useMemo, useState } from 'react';
import { Check, Clipboard, AlertTriangle } from 'lucide-react';
import type { TaperSchedule, TaperStep } from '@/lib/types';

interface ClinicianNoteProps {
  schedule: TaperSchedule;
}

type Symptoms = 'improving' | 'stable' | 'worsening' | 'asymptomatic';
type Exposure = 'under-10-days' | '10-days-to-2-weeks' | 'over-2-weeks';

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

function formatSchedule(steps: TaperStep[]) {
  return steps
    .map((step) => `${dailyDose(step)} mg/day (${step.dose} mg ${frequencyLabel[step.frequency]}) for ${step.days} day${step.days === 1 ? '' : 's'}`)
    .join(' → ');
}

export default function ClinicianNote({ schedule }: ClinicianNoteProps) {
  const [symptoms, setSymptoms] = useState<Symptoms>('improving');
  const [exposure, setExposure] = useState<Exposure>('under-10-days');
  const [suspectedLymphoma, setSuspectedLymphoma] = useState(false);
  const [pneumocystisRisk, setPneumocystisRisk] = useState(false);
  const [giRisk, setGiRisk] = useState(false);
  const [copied, setCopied] = useState(false);

  const note = useMemo(() => {
    const statusText: Record<Symptoms, string> = {
      improving: 'Neurologic symptoms are improving.',
      stable: 'Neurologic symptoms are stable.',
      worsening: 'Neurologic symptoms are worsening; reassess for an alternative cause and the need for dose escalation before tapering.',
      asymptomatic: 'Patient is currently asymptomatic; corticosteroids may not be needed solely for persistent radiographic edema.',
    };
    const durationText: Record<Exposure, string> = {
      'under-10-days': 'Total exposure is under 10 days, so a faster taper can be reasonable if symptoms remain controlled.',
      '10-days-to-2-weeks': 'Given more than 10 days of exposure, assess each reduction over several days and slow the lower-dose portion if symptoms recur.',
      'over-2-weeks': 'Given prolonged exposure, use a slower lower-dose taper and monitor for adrenal insufficiency; consider endocrine input/testing when clinically indicated.',
    };

    const lines = [
      `Dexamethasone plan${schedule.indication ? ` for ${schedule.indication}` : ''}: ${statusText[symptoms]}`,
      'Dose to symptoms, not residual MRI edema alone. If symptoms remain controlled, proceed with taper; clinical effect of a dose change should be judged over approximately 72 hours.',
      `Planned taper: ${formatSchedule(schedule.steps)}. Prefer morning dosing, with an early-afternoon second dose when needed, and avoid evening dosing when feasible.`,
      durationText[exposure],
      'If focal neurologic symptoms recur, return to the last effective dose, hold until controlled, then retry a slower taper. Identify the minimum effective maintenance dose if steroid-dependent.',
      'Monitor for insomnia, mood/psychiatric symptoms, hyperglycemia, proximal myopathy, infection, and VTE risk.',
    ];

    if (suspectedLymphoma) {
      lines.splice(1, 0, 'Important: CNS lymphoma is suspected and biopsy has not yet occurred. Avoid initiating corticosteroids unless clinically necessary because of potential loss of diagnostic yield.');
    }
    if (pneumocystisRisk) {
      lines.push('PJP prophylaxis: anticipated corticosteroid exposure meets a high-risk threshold. Start TMP-SMX if not contraindicated, or use an appropriate alternative after reviewing allergy, renal function, and G6PD status where relevant.');
    }
    if (giRisk) {
      lines.push('GI prophylaxis: consider a PPI or H2 blocker given the identified GI-risk context (for example NSAID/anticoagulant use, ulcer history, or perioperative course).');
    }

    return lines.join('\n\n');
  }, [schedule, symptoms, exposure, suspectedLymphoma, pneumocystisRisk, giRisk]);

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
          <h2 className="text-base font-bold text-slate-900">Clinician note / email blurb</h2>
          <p className="mt-1 text-sm text-slate-600">Add the discharge context, then copy a concise symptom-guided plan into a note or email.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Current neurologic status
          <select value={symptoms} onChange={(event) => setSymptoms(event.target.value as Symptoms)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none">
            <option value="improving">Improving</option>
            <option value="stable">Stable</option>
            <option value="worsening">Worsening / needs reassessment</option>
            <option value="asymptomatic">Asymptomatic</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Total steroid exposure
          <select value={exposure} onChange={(event) => setExposure(event.target.value as Exposure)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none">
            <option value="under-10-days">Under 10 days</option>
            <option value="10-days-to-2-weeks">10 days to 2 weeks</option>
            <option value="over-2-weeks">Over 2 weeks</option>
          </select>
        </label>
      </div>

      <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        <label className="flex cursor-pointer items-start gap-2"><input checked={suspectedLymphoma} onChange={(event) => setSuspectedLymphoma(event.target.checked)} type="checkbox" className="mt-0.5" /><span>Suspected CNS lymphoma before diagnostic biopsy</span></label>
        <label className="flex cursor-pointer items-start gap-2"><input checked={pneumocystisRisk} onChange={(event) => setPneumocystisRisk(event.target.checked)} type="checkbox" className="mt-0.5" /><span>Anticipated high-risk PJP exposure, for example ≥4 weeks at dexamethasone ≥3 mg/day</span></label>
        <label className="flex cursor-pointer items-start gap-2"><input checked={giRisk} onChange={(event) => setGiRisk(event.target.checked)} type="checkbox" className="mt-0.5" /><span>GI-risk context, for example NSAID/anticoagulant use, ulcer history, or perioperative course</span></label>
      </div>

      {suspectedLymphoma && <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />CNS lymphoma can be lympholytic with steroids. This plan flags the issue but does not replace an urgent diagnostic and treatment decision.</div>}

      <textarea readOnly value={note} aria-label="Copyable clinician note" className="mt-4 min-h-64 w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-800 focus:outline-none" />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Educational drafting aid. Confirm the regimen, indications, contraindications, and discharge medications for the individual patient.</p>
        <button type="button" onClick={copyNote} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}{copied ? 'Copied' : 'Copy blurb'}
        </button>
      </div>
    </section>
  );
}
