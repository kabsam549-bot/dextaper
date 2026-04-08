'use client';

import { useState, useRef } from 'react';
import { Pill, RotateCcw } from 'lucide-react';
import type { TaperSchedule } from '@/lib/types';
import TaperBuilder from '@/components/taper-builder';
import PatientHandout from '@/components/patient-handout';
import PdfExport from '@/components/pdf-export';

export default function Home() {
  const [schedule, setSchedule] = useState<TaperSchedule | null>(null);
  const handoutRef = useRef<HTMLDivElement>(null);

  function handleGenerate(s: TaperSchedule) {
    setSchedule(s);
    setTimeout(() => {
      document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function handleReset() {
    setSchedule(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Pill className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">DexTaper</h1>
            <p className="text-[11px] text-gray-500 leading-tight">Dexamethasone Taper Instructions</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Builder Section */}
        <section className="print:hidden">
          <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-4 sm:p-6">
            <TaperBuilder onGenerate={handleGenerate} />
          </div>
        </section>

        {/* Preview Section */}
        {schedule && (
          <section id="preview-section" className="mt-6">
            {/* Action bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 print:hidden">
              <h2 className="text-base font-bold text-gray-800">Patient Handout Preview</h2>
              <div className="flex items-center gap-2">
                <PdfExport
                  targetId="patient-handout"
                  schedule={schedule}
                />
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  New
                </button>
              </div>
            </div>

            {/* Handout */}
            <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-4 sm:p-8 print:shadow-none print:border-none print:p-0">
              <PatientHandout ref={handoutRef} schedule={schedule} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
