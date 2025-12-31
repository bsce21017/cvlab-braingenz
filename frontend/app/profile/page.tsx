'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import ProfileForm from '@/components/profile/ProfileForm';
import AccountActions from '@/components/profile/AccountActions';
import AccountInfo from '@/components/profile/AccountInfo';
import ActivityHistory from '@/components/profile/ActivityHistory';

export default function ProfilePage() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex justify-end px-6 pt-4">
        <LanguageSwitcher />
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">{t('profile.title')}</h1>
          <p className="text-gray-600">{t('profile.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProfileForm />
          </div>
          <div className="space-y-6">
            <AccountActions />
            <AccountInfo />
            <ActivityHistory />
          </div>
        </div>
      </main>
    </div>
  );
}

