'use client';

import { FileText, CheckCircle } from 'lucide-react';

interface FileDisplayProps {
  fileName: string;
  fileSize: string;
  pageCount: number;
  status: string;
  isRTL?: boolean;
}

export default function FileDisplay({
  fileName,
  fileSize,
  pageCount,
  status,
  isRTL = false,
}: FileDisplayProps) {
  return (
    <div className={`flex items-center justify-between bg-white border border-brand-blue/10 rounded-2xl p-5 mb-8 shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="w-12 h-12 bg-brand-blue/[0.06] rounded-xl flex items-center justify-center">
          <FileText className="w-6 h-6 text-brand-blue" />
        </div>
        <div className={isRTL ? 'text-right' : ''}>
          <p className="text-foreground text-sm font-semibold">{fileName}</p>
          <p className="text-muted-foreground text-xs">
            {fileSize} • {pageCount} pages
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-brand-green/[0.08] px-3 py-1.5 rounded-full">
        <CheckCircle className="w-3.5 h-3.5 text-brand-green" />
        <span className="text-brand-green text-xs font-bold">{status}</span>
      </div>
    </div>
  );
}
