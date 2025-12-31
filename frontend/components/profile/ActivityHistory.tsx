'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Download, FileText, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getUserActivity, ResumeActivityItem } from '@/lib/api';

export default function ActivityHistory() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ResumeActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await getUserActivity(10);
        setActivities(data.activities);
      } catch (error) {
        console.error('Error fetching activity:', error);
        // Don't show error to user, just show empty state
      } finally {
        setLoading(false);
      }
    }
    
    fetchActivity();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.activityHistory')}</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.activityHistory')}</h3>
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t('profile.noActivity') || 'No recent activity'}</p>
          <p className="text-xs text-gray-400 mt-1">
            {t('profile.uploadResumeToSeeActivity') || 'Upload a resume to see your activity history'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {activity.is_optimized ? (
                  <Download className="w-5 h-5 text-orange-600" />
                ) : (
                  <FileText className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {activity.is_optimized 
                    ? t('profile.resumeOptimized') || 'Resume Optimized'
                    : t('profile.resumeUploaded') || 'Resume Uploaded'}
                </h4>
                <p className="text-sm text-gray-600 truncate">{activity.filename}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(activity.updated_at || activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

