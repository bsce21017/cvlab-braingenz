'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { LogOut, Trash2 } from 'lucide-react';

export default function AccountActions() {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.accountActions')}</h3>
      <div className="space-y-3">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="text-sm">{t('profile.logout')}</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-5 h-5" />
          <span className="text-sm">{t('profile.deleteAccount')}</span>
        </button>
      </div>
    </div>
  );
}

