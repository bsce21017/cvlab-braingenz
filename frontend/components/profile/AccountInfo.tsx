'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

export default function AccountInfo() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [memberSince, setMemberSince] = useState<string>('');
  const [lastSignIn, setLastSignIn] = useState<string>('');

  useEffect(() => {
    if (user) {
      if (user.created_at) {
        const createdDate = new Date(user.created_at);
        setMemberSince(format(createdDate, 'MMMM yyyy'));
      }
      
      if (user.last_sign_in_at) {
        const lastSignInDate = new Date(user.last_sign_in_at);
        setLastSignIn(formatDistanceToNow(lastSignInDate, { addSuffix: true }));
      } else {
        setLastSignIn('Never');
      }
    }
  }, [user]);

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.accountInfo')}</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{t('profile.memberSince')}</span>
          <span className="text-sm text-gray-900 font-medium">{memberSince || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{t('profile.lastSignIn') || 'Last Sign In'}</span>
          <span className="text-sm text-gray-900 font-medium">{lastSignIn || 'N/A'}</span>
        </div>
        {user?.email_confirmed_at && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Email Verified</span>
            <span className="text-sm text-green-600 font-medium">✓ Verified</span>
          </div>
        )}
      </div>
    </div>
  );
}


