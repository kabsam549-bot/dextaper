'use client';

import { useState } from 'react';
import { Download, Printer } from 'lucide-react';

interface PdfExportProps {
  targetId: string;
  patientName?: string;
}

export default function PdfExport({ targetId, patientName }: PdfExportProps) {
  const [generating, setGenerating] = useState(false);

  async function handleExportPdf() {
    setGenerating(true);
    try {
      const element = document.getElementById(targetId);
      if (!element) return;

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = patientName
        ? `dex-taper-${patientName.replace(/\s+/g, '-').toLowerCase()}.pdf`
        : 'dex-taper-instructions.pdf';
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleExportPdf}
        disabled={generating}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        <Download className="h-4 w-4" />
        {generating ? 'Generating...' : 'Download PDF'}
      </button>
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <Printer className="h-4 w-4" />
        Print
      </button>
    </div>
  );
}
