'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import type { TaperSchedule, TaperStep, Frequency } from '@/lib/types';
import { templates, indications, frequencies } from '@/lib/taper-templates';
import { getTotalDays } from '@/lib/taper-engine';
import { format } from 'date-fns';

interface TaperBuilderProps {
  onGenerate: (schedule: TaperSchedule) => void;
}

export default function TaperBuilder({ onGenerate }: TaperBuilderProps) {
  const [patientName, setPatientName] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [indication, setIndication] = useState(indications[0]);
  const [providerName, setProviderName] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [steps, setSteps] = useState<TaperStep[]>(templates[0].steps);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate({
      patientName,
      startDate,
      indication,
      providerName,
      providerPhone,
      steps,
    });
  }

  const totalDays = getTotalDays(steps);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
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

      {/* Patient Info Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Patient Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={patientName}
            onChange={e => setPatientName(e.target.value)}
            placeholder="Patient name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Indication</label>
          <select
            value={indication}
            onChange={e => setIndication(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          >
            {indications.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Provider Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Provider Name</label>
          <input
            type="text"
            value={providerName}
            onChange={e => setProviderName(e.target.value)}
            placeholder="Dr. Smith"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Contact Phone</label>
          <input
            type="tel"
            value={providerPhone}
            onChange={e => setProviderPhone(e.target.value)}
            placeholder="(713) 555-1234"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Taper Steps */}
      <div>
        <div className="flex items-center justify-between mb-3">
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
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
            >
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
                    className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">mg</span>
                </div>
                <select
                  value={step.frequency}
                  onChange={e => updateStep(i, 'frequency', e.target.value)}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
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
                    className="w-14 rounded border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
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
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-colors"
      >
        Generate Patient Instructions
      </button>
    </form>
  );
}
