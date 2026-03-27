'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ur';

  return (
    <div className="w-full max-w-lg mx-auto" dir="ltr">
      {/* Label row — always LTR layout, but swap content positions for RTL */}
      {label && (
        <div className="flex justify-between items-center mb-3">
          {isRTL ? (
            <>
              <span className="text-xs font-semibold text-brand-blue bg-brand-blue/[0.06] px-3 py-1.5 rounded-full">{label}</span>
              <span className="text-brand-blue text-2xl font-bold">{progress}%</span>
            </>
          ) : (
            <>
              <span className="text-brand-blue text-2xl font-bold">{progress}%</span>
              <span className="text-xs font-semibold text-brand-blue bg-brand-blue/[0.06] px-3 py-1.5 rounded-full">{label}</span>
            </>
          )}
        </div>
      )}

      {/* Bar — always fills left to right */}
      <div className="relative w-full h-3 bg-brand-blue/[0.08] rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #093D7F, #0B4FA0, #F9CB12)',
          }}
        />
        {progress < 100 && progress > 0 && (
          <div
            className="absolute top-0 left-0 h-full rounded-full animate-shimmer"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              backgroundSize: '200% 100%',
            }}
          />
        )}
      </div>
    </div>
  );
}
