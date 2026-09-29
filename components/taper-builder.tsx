'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import type { TaperSchedule, TaperStep, Frequency, PillSize } from '@/lib/types';
import { templates, indications, frequencies } from '@/lib/taper-templates';
import { getTotalDays } from '@/lib/taper-engine';

function todayIsoDate() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

interface TaperBuilderProps {
  onGenerate: (schedule: TaperSchedule) => void;
}

const pillSizes: { value: PillSize; label: string }[] = [
  { value: 0.5, label: '0.5 mg' },
  { value: 1, label: '1 mg' },
  { value: 1.5, label: '1.5 mg' },
  { value: 2, label: '2 mg' },
  { value: 4, label: '4 mg' },
];

type TaperPace = 'gentle' | 'rapid';

const startingDoseOptions = [4, 8, 12, 16];

function doseLevels(startingDose: number, pace: TaperPace): number[] {
  const gentleLevels: Record<number, number[]> = {
    4: [4, 2],
    8: [8, 6, 4, 2],
    12: [12, 8, 6, 4, 2],
    16: [16, 12, 8, 6, 4, 2],
  };
  const rapidLevels: Record<number, number[]> = {
    4: [4, 2],
    8: [8, 4, 2],
    12: [12, 6, 2],
    16: [16, 8, 4, 2],
  };
  return (pace === 'gentle' ? gentleLevels : rapidLevels)[startingDose];
}

function keepEndpoints(levels: number[], maximumSteps: number): number[] {
  if (maximumSteps >= levels.length) return levels;
  if (maximumSteps <= 1) return [levels[0]];

  return Array.from({ length: maximumSteps }, (_, index) => (
    levels[Math.round((index * (levels.length - 1)) / (maximumSteps - 1))]
  ));
}

function taperSteps(startingDose: number, totalDays: number, pace: TaperPace): TaperStep[] {
  const levels = keepEndpoints(doseLevels(startingDose, pace), totalDays);
  const baseDays = Math.floor(totalDays / levels.length);
  const remainingDays = totalDays % levels.length;

  return levels.map((dailyMg, index) => ({
    dose: dailyMg <= 2 ? dailyMg : dailyMg / 2,
    frequency: dailyMg <= 2 ? 'daily' : 'BID',
    days: baseDays + (index < remainingDays ? 1 : 0),
  }));
}

export default function TaperBuilder({ onGenerate }: TaperBuilderProps) {
  const [patientName, setPatientName] = useState('');
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [indication, setIndication] = useState(indications[0]);
  const [providerName, setProviderName] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [pillSize, setPillSize] = useState<PillSize>(2);
  const [steps, setSteps] = useState<TaperStep[]>(templates[0].steps);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
  const [startingDose, setStartingDose] = useState(8);
  const [requestedDays, setRequestedDays] = useState(10);

  function handleTemplateChange(templateId: string) {
    setSelectedTemplate(templateId);
    if (templateId === 'custom') return;
    const t = templates.find(t => t.id === templateId);
    if (t) {
      setSteps([...t.steps.map(s => ({ ...s }))]);
      setIndication(t.indication);
    }
  }

  function updateStep(index: number, field: keyof TaperStep, value: string | number) {
    const newSteps = [...steps];
    if (field === 'frequency') {
      newSteps[index] = { ...newSteps[index], [field]: value as Frequency };
    } else {
      newSteps[index] = { ...newSteps[index], [field]: Number(value) };
    }
    setSteps(newSteps);
    setSelectedTemplate('custom');
  }

  function addStep() {
    setSteps([...steps, { dose: 1, frequency: 'daily', days: 3 }]);
    setSelectedTemplate('custom');
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
    setSelectedTemplate('custom');
  }

  function applyTaperBuilder(pace: TaperPace) {
    const totalDays = Math.max(1, Math.round(requestedDays) || 1);
    setSteps(taperSteps(startingDose, totalDays, pace));
    setSelectedTemplate('custom');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate({
      patientName,
      startDate,
      indication,
      providerName,
      providerPhone,
      pillSize,
      steps,
    });
  }

  const totalDays = getTotalDays(steps);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Taper Protocol
        </label>
        <div className="relative">
          <select
            value={selectedTemplate}
            onChange={e => handleTemplateChange(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.description}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Quick Taper Builder */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div>
          <h2 className="text-sm font-semibold text-blue-950">Quick taper builder</h2>
          <p className="mt-0.5 text-xs text-blue-800">Choose a starting daily dose and total duration, then apply an editable starting schedule.</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-blue-950">
            Starting dose (mg/day)
            <select
              value={startingDose}
              onChange={e => setStartingDose(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              {startingDoseOptions.map(dose => <option key={dose} value={dose}>{dose} mg/day</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-blue-950">
            Total taper days
            <input
              type="number"
              min="1"
              value={requestedDays}
              onChange={e => setRequestedDays(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => applyTaperBuilder('gentle')} className="rounded-lg bg-blue-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            Apply gentle taper
          </button>
          <button type="button" onClick={() => applyTaperBuilder('rapid')} className="rounded-lg border border-blue-300 bg-white px-3 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-100">
            Apply rapid taper
          </button>
        </div>
        <p className="mt-2 text-xs text-blue-800">The generated steps are a starting point and remain fully editable. Individualize to the patient.</p>
      </div>

      {/* Patient + Date */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Patient Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={patientName}
            onChange={e => setPatientName(e.target.value)}
            placeholder="Patient name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Indication + Pill Size */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Indication</label>
          <select
            value={indication}
            onChange={e => setIndication(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          >
            {indications.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Pill Strength Being Dispensed
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {pillSizes.map(ps => (
              <button
                key={ps.value}
                type="button"
                onClick={() => setPillSize(ps.value)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pillSize === ps.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ps.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Provider Info */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Provider Name</label>
          <input
            type="text"
            value={providerName}
            onChange={e => setProviderName(e.target.value)}
            placeholder="Dr. Smith"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Contact Phone</label>
          <input
            type="tel"
            value={providerPhone}
            onChange={e => setProviderPhone(e.target.value)}
            placeholder="(713) 555-1234"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Taper Steps */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">
            Taper Steps
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({totalDays} days total)
            </span>
          </label>
          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Step
          </button>
        </div>

        <div className="space-y-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {i + 1}
                </span>
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={step.dose}
                      onChange={e => updateStep(i, 'dose', e.target.value)}
                      className="w-16 rounded border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500">mg</span>
                  </div>
                  <select
                    value={step.frequency}
                    onChange={e => updateStep(i, 'frequency', e.target.value)}
                    className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                  >
                    {frequencies.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">for</span>
                    <input
                      type="number"
                      min="1"
                      value={step.days}
                      onChange={e => updateStep(i, 'days', e.target.value)}
                      className="w-14 rounded border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                    />
                    <span className="text-xs text-gray-500">days</span>
                  </div>
                </div>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Pill count preview */}
              <div className="mt-1 ml-8 text-xs text-gray-400">
                {step.dose / pillSize % 1 === 0 || step.dose / pillSize >= 0.5
                  ? `${step.dose / pillSize % 1 === 0 ? step.dose / pillSize : (step.dose / pillSize).toFixed(1)} × ${pillSize} mg tablet${step.dose / pillSize !== 1 ? 's' : ''} per dose`
                  : 'Dose not evenly divisible by pill size'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-colors"
      >
        Generate Patient Instructions
      </button>
    </form>
  );
}
