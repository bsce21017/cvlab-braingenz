'use client';

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';

export default function ResumePreviewHeader() {
  const { language } = useLanguage();
  const isRTL = language === 'ur';

  return (
    <header className="bg-white border-b border-gray-200" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center" dir="ltr">
            <Image
              src="/assets/Main_logo.svg"
              alt="CVLab Logo"
              width={200}
              height={200}
              className="h-20 w-auto"
            />
          </div>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
