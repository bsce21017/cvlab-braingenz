'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileForm() {
  const { t } = useLanguage();
  const { user, updateProfile, updatePassword } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Extract user data
  const fullName = user?.user_metadata?.full_name || '';
  const [firstName, lastName] = fullName.split(' ').length > 1
    ? [fullName.split(' ')[0], fullName.split(' ').slice(1).join(' ')]
    : [fullName, ''];
  const email = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  // Form state
  const [formData, setFormData] = useState({
    firstName: firstName,
    lastName: lastName,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update form when user data changes
  useEffect(() => {
    const fullName = user?.user_metadata?.full_name || '';
    const [first, last] = fullName.split(' ').length > 1
      ? [fullName.split(' ')[0], fullName.split(' ').slice(1).join(' ')]
      : [fullName, ''];
    setFormData(prev => ({
      ...prev,
      firstName: first,
      lastName: last,
    }));
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      let hasErrors = false;

      // Update profile if name changed
      const currentFullName = user?.user_metadata?.full_name || '';
      const newFullName = `${formData.firstName} ${formData.lastName}`.trim();

      if (newFullName && newFullName !== currentFullName) {
        const { error } = await updateProfile(newFullName);
        if (error) {
          toast.error(t('profile.updateFailed') || 'Failed to update profile');
          hasErrors = true;
        }
      }

      // Update password if provided
      if (formData.currentPassword && formData.newPassword) {
        // Validate passwords
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error(t('passwordsDoNotMatch') || 'Passwords do not match');
          setIsSaving(false);
          return;
        }

        if (formData.newPassword.length < 6) {
          toast.error(t('passwordTooShort') || 'Password must be at least 6 characters');
          setIsSaving(false);
          return;
        }

        const { error } = await updatePassword(formData.currentPassword, formData.newPassword);
        if (error) {
          toast.error(error.message || t('profile.passwordUpdateFailed') || 'Failed to update password');
          hasErrors = true;
        } else {
          // Clear password fields on success
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }));
          toast.success(t('profile.passwordUpdateSuccess') || 'Password updated successfully');
        }
      }

      if (!hasErrors && newFullName && newFullName !== currentFullName) {
        toast.success(t('profile.updateSuccess') || 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('profile.updateFailed') || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current user data
    const fullName = user?.user_metadata?.full_name || '';
    const [first, last] = fullName.split(' ').length > 1
      ? [fullName.split(' ')[0], fullName.split(' ').slice(1).join(' ')]
      : [fullName, ''];

    setFormData({
      firstName: first,
      lastName: last,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="bg-white rounded-lg p-8 space-y-8">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
                <span className="text-3xl font-bold text-white">
                  {formData.firstName.charAt(0).toUpperCase() || email.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-600">{t('profile.changePhoto')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-2">{t('profile.firstName')}</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-2">{t('profile.lastName')}</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">{t('profile.email')}</label>
        <input
          type="email"
          value={email}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-gray-50"
          disabled
        />
        <p className="mt-1 text-xs text-gray-500">{t('profile.emailCannotBeChanged')}</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.changePassword')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">{t('profile.currentPassword')}</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">{t('profile.newPassword')}</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">{t('profile.confirmPassword')}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="px-8 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? t('profile.saving') || 'Saving...' : t('profile.saveChanges')}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-8 py-3 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          {t('profile.cancel')}
        </button>
      </div>
    </div>
  );
}
