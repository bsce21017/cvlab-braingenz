'use client';

import { Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProTip() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ur';

  return (
    <div className="max-w-md mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`bg-gradient-to-br from-brand-yellow/[0.08] to-brand-blue/[0.04] border border-brand-yellow/20 rounded-2xl p-5 flex items-start gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
        <div className="flex-shrink-0 w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center shadow-sm">
          <Lightbulb className="w-5 h-5 text-brand-blue-dark" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold text-foreground mb-1 ${isRTL ? 'leading-[1.8]' : ''}`}>{t('proTipTitle')}</h3>
          <p className={`text-xs text-muted-foreground ${isRTL ? 'leading-[2]' : 'leading-relaxed'}`}>
            {t('proTipText')}
          </p>
        </div>
      </div>
    </div>
  );
}
