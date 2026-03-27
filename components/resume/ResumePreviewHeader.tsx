'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';

export default function ResumePreviewHeader() {
  const { language } = useLanguage();
  const isRTL = language === 'ur';

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-brand-blue/[0.06]" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center" dir="ltr">
            <Image
              src="/assets/Main logo.svg"
              alt="CV Summit Logo"
              width={160}
              height={80}
              className="h-12 w-auto"
            />
          </Link>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
