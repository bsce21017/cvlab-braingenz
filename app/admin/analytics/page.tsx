'use client';

import React from 'react';
import DashboardHeader from '@/components/admin/DashboardHeader';
import AnalyticsPage from '@/components/admin/analytics/AnalyticsPage';
import TokenUsageCard from '@/components/admin/TokenUsageCard';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminAnalyticsPage() {
  const { language } = useLanguage();
  const isRTL = language === 'ur';

  return (
    <div className="flex flex-col h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <DashboardHeader />
      <div className="flex-1 overflow-auto p-8 space-y-8">
        <AnalyticsPage />
        <TokenUsageCard />
      </div>
    </div>
  );
}
