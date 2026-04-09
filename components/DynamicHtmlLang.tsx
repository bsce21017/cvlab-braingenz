'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function DynamicHtmlLang() {
  const { language } = useLanguage();

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', language === 'ur' ? 'ur' : 'en');
    html.setAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
  }, [language]);

  return null;
}
