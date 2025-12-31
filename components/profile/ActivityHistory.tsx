'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Download } from 'lucide-react';

export default function ActivityHistory() {
  const { t } = useLanguage();

  const activities = [
    { id: 1, days: 2 },
    { id: 2, days: 2 },
    { id: 3, days: 2 },
    { id: 4, days: 2 },
    { id: 5, days: 2 },
  ];

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.activityHistory')}</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">{t('profile.resumeDownloaded')}</h4>
              <p className="text-sm text-gray-600">{t('profile.downloadedOptimized')}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.days === 2 ? t('profile.twoDaysAgoActivity') : `${activity.days} ${t('profile.daysAgo')}`}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

