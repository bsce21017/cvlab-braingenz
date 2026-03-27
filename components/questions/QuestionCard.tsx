'use client';

interface QuestionCardProps {
  number: number;
  title: string;
  subtitle?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  isRTL?: boolean;
}

export default function QuestionCard({
  number,
  title,
  value,
  onChange,
}: QuestionCardProps) {
  return (
    <div className="group" dir="ltr">
      <div className="flex gap-5">
        {/* Number badge */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-blue/[0.06] flex items-center justify-center mt-0.5">
          <span className="text-brand-blue text-sm font-bold">{number}</span>
        </div>
        <div className="flex-1 space-y-2.5">
          <h3 className="text-foreground text-[15px] font-semibold text-left leading-snug">{title}</h3>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[100px] px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl text-foreground placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none text-left transition-all duration-200"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}
