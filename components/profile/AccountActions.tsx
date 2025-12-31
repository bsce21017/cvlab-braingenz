'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Trash2 } from 'lucide-react';

export default function AccountActions() {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Use replace to prevent back button from going back to profile
      router.replace('/signin');
      // Force a hard refresh to ensure middleware runs
      window.location.href = '/signin';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion with confirmation dialog
    const confirmed = window.confirm(
      t('profile.deleteAccountConfirmation') ||
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (confirmed) {
      console.log('Delete account requested - implementation needed');
      // Future: Call API to delete account
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.accountActions')}</h3>
      <div className="space-y-3">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">{isLoggingOut ? t('profile.loggingOut') || 'Logging out...' : t('profile.logout')}</span>
        </button>
        <button
          onClick={handleDeleteAccount}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-sm">{t('profile.deleteAccount')}</span>
        </button>
      </div>
    </div>
  );
}

