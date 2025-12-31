'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Lock, Mail, Calendar, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { user, updateProfile, updatePassword } = useAdminAuth();
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  // Extract first and last name from full_name
  const fullName = user?.user_metadata?.full_name || '';
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const [formData, setFormData] = useState({
    firstName: firstName,
    lastName: lastName,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Sync form data when user changes
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
      }));
    }
  }, [user?.user_metadata?.full_name]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    let hasErrors = false;

    try {
      // Update profile if name changed
      const currentFullName = user?.user_metadata?.full_name || '';
      const newFullName = `${formData.firstName} ${formData.lastName}`.trim();

      if (newFullName && newFullName !== currentFullName) {
        const { error } = await updateProfile(newFullName);
        if (error) {
          toast.error(t('profile.updateFailed') || 'Failed to update profile');
          hasErrors = true;
        } else {
          toast.success(t('profile.updateSuccess') || 'Profile updated successfully');
        }
      }

      // Update password if provided
      if (formData.currentPassword && formData.newPassword) {
        // Validate passwords
        if (formData.newPassword.length < 6) {
          toast.error(t('passwordTooShort') || 'Password must be at least 6 characters');
          setIsSaving(false);
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          toast.error(t('passwordsDoNotMatch') || 'Passwords do not match');
          setIsSaving(false);
          return;
        }

        const { error } = await updatePassword(formData.currentPassword, formData.newPassword);
        if (error) {
          toast.error(error.message || t('profile.passwordUpdateFailed') || 'Failed to update password');
          hasErrors = true;
        } else {
          toast.success(t('profile.passwordUpdateSuccess') || 'Password updated successfully');
          // Clear password fields on success
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }));
        }
      }

      if (!hasErrors && !formData.currentPassword && newFullName === currentFullName) {
        toast.info('No changes to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return t('profile.notAvailable') || 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const memberSince = formatDate(user?.created_at);
  const userRole = user?.user_metadata?.role || user?.app_metadata?.role || 'user';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings') || 'Settings'}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('manageAccountSettings') || 'Manage your account settings and preferences'}</p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          {t('profile.personalInfo') || 'Personal Information'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.firstName')}
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('profile.firstName')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.lastName')}
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('profile.lastName')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.email')}
            </label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('profile.emailCannotBeChanged') || 'Email cannot be changed'}
            </p>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {t('profile.security') || 'Security'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.currentPassword')}
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('profile.enterCurrentPassword')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.newPassword')}
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('profile.enterNewPassword')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile.confirmPassword')}
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('profile.confirmNewPassword')}
            />
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {t('profile.accountInfo') || 'Account Information'}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{t('profile.memberSince')}</span>
            <span className="text-sm font-medium text-gray-900">{memberSince}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t('role') || 'Role'}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (t('profile.saving') || 'Saving...') : (t('profile.saveChanges') || 'Save Changes')}
        </button>
      </div>
    </div>
  );
}
