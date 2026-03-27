'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

import { useLanguage } from '@/contexts/LanguageContext';

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex justify-end px-6 pt-4">
        
      </div>
      <main className="flex-1 bg-[#F7F9FC]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-semibold text-foreground mb-4">
            {t('privacyPolicy')}
          </h1>
          <p className="text-gray-600">{t('admin.comingSoon')}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}


