'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountInfo() {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return t('profile.notAvailable') || 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Calculate relative time
  const getRelativeTime = (dateString: string | undefined) => {
    if (!dateString) return t('profile.notAvailable') || 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return t('profile.today') || 'Today';
    if (diffInDays === 1) return t('profile.yesterday') || 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} ${t('profile.daysAgo') || 'days ago'}`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} ${t('profile.weeksAgo') || 'weeks ago'}`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} ${t('profile.monthsAgo') || 'months ago'}`;
    return `${Math.floor(diffInDays / 365)} ${t('profile.yearsAgo') || 'years ago'}`;
  };

  const memberSince = formatDate(user?.created_at);
  const lastActive = getRelativeTime(user?.last_sign_in_at);

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.accountInfo')}</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{t('profile.memberSince')}</span>
          <span className="text-sm text-gray-900">{memberSince}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{t('profile.lastActive')}</span>
          <span className="text-sm text-gray-900">{lastActive}</span>
        </div>
      </div>
    </div>
  );
}

