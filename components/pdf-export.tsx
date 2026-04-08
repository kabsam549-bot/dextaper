'use client';

import { useState } from 'react';
import { Download, Printer, CalendarPlus } from 'lucide-react';
import type { TaperSchedule } from '@/lib/types';
import { generateICS } from '@/lib/taper-engine';

interface PdfExportProps {
  targetId: string;
  schedule: TaperSchedule;
}

export default function PdfExport({ targetId, schedule }: PdfExportProps) {
  const [generating, setGenerating] = useState(false);

  async function handleExportPdf() {
    setGenerating(true);
    try {
      const element = document.getElementById(targetId);
      if (!element) return;

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Add padding wrapper for PDF
      element.style.padding = '24px';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        windowWidth: 800, // force desktop-like rendering
      });

      element.style.padding = '';

      const imgWidth = 190; // A4 with margins
      const pageHeight = 277; // A4 with margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');

      let heightLeft = imgHeight;
      let position = 10; // top margin

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = schedule.patientName
        ? `dex-taper-${schedule.patientName.replace(/\s+/g, '-').toLowerCase()}.pdf`
        : 'dex-taper-instructions.pdf';
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }

  function handleExportCalendar() {
    const ics = generateICS(schedule);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = schedule.patientName
      ? `dex-taper-${schedule.patientName.replace(/\s+/g, '-').toLowerCase()}.ics`
      : 'dex-taper.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleExportPdf}
        disabled={generating}
        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        {generating ? 'Generating...' : 'PDF'}
      </button>
      <button
        onClick={handleExportCalendar}
        className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors"
      >
        <CalendarPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Calendar
      </button>
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Print
      </button>
    </div>
  );
}
