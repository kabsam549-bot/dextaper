'use client';

import { useState, useCallback } from 'react';
import { Download, Printer, CalendarPlus } from 'lucide-react';
import type { TaperSchedule } from '@/lib/types';
import { generateICS } from '@/lib/taper-engine';

interface PdfExportProps {
  targetId: string;
  schedule: TaperSchedule;
}

export default function PdfExport({ targetId, schedule }: PdfExportProps) {
  const [generating, setGenerating] = useState(false);

  const handleExportPdf = useCallback(async () => {
    setGenerating(true);
    try {
      const element = document.getElementById(targetId);
      if (!element) return;

      // Clone the handout into a hidden iframe for clean PDF rendering
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '800px';
      iframe.style.height = '100vh';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // Copy all stylesheets
      const stylesheets = Array.from(document.styleSheets);
      let cssText = '';
      for (const sheet of stylesheets) {
        try {
          const rules = Array.from(sheet.cssRules);
          cssText += rules.map(r => r.cssText).join('\n');
        } catch {
          // Cross-origin sheets — fetch via link
          if (sheet.href) {
            cssText += `@import url("${sheet.href}");\n`;
          }
        }
      }

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            ${cssText}
            @media print {
              body { margin: 0; padding: 24px; }
            }
            body {
              margin: 0;
              padding: 24px;
              background: white;
              font-family: system-ui, -apple-system, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            /* Force colors for print */
            * { color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>${element.innerHTML}</body>
        </html>
      `);
      iframeDoc.close();

      // Wait for styles to apply
      await new Promise(resolve => setTimeout(resolve, 500));

      iframe.contentWindow?.print();

      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [targetId]);

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
