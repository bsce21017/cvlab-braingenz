'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

function SignUpContent() {
  const { language, setLanguage, t } = useLanguage();
  const isRTL = language === 'ar';
  const { signUp, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  const passwordStrength = useMemo(() => {
    const password = formData.password;
    if (password.length === 0) return { level: 0, label: '' };
    if (password.length < 6) return { level: 1, label: t('weak') };
    if (password.length < 10) return { level: 2, label: t('good') };
    return { level: 3, label: t('strong') };
  }, [formData.password, t]);

  const clearSensitiveFields = () => {
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError(t('passwordTooShort') || 'Password must be at least 6 characters long.');
      return;
    }

    if (!formData.agreeToTerms) {
      setError(t('mustAgreeToTerms') || 'You must agree to the terms and conditions.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: signUpError } = await signUp(formData.email, formData.password, formData.fullName);

      if (signUpError) {
        const errorMessage = signUpError.message.toLowerCase();

        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          setError(t('emailAlreadyRegistered') || 'This email is already registered. Please sign in instead.');
          toast.error(t('emailAlreadyRegistered') || 'Email already registered');
          setTimeout(() => router.push('/signin'), 2000);
        } else if (errorMessage.includes('invalid email')) {
          setError(t('invalidEmail') || 'Please enter a valid email address.');
        } else if (errorMessage.includes('password')) {
          setError(signUpError.message);
        } else {
          setError(signUpError.message || t('failedToCreateAccount') || 'Failed to create account.');
        }
        clearSensitiveFields();
        setIsSubmitting(false);
        return;
      }

      toast.success(t('signUpSuccess') || 'Account created successfully! Welcome!');
      window.location.href = '/admin/dashboard';
    } catch (err) {
      console.error('Signup error:', err);
      setError(t('unexpectedError') || 'An unexpected error occurred. Please try again.');
      clearSensitiveFields();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="relative hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/assets/background-image.png')",
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 flex h-full flex-col justify-center px-14 text-white space-y-4">
          <h1 className="text-5xl font-normal leading-tight max-w-xl">
            {t('optimizeCareer')}
          </h1>
          <p className="text-lg text-gray-200 leading-relaxed max-w-xl">
            {t('transformCV')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#f7f9fb] px-6 py-12">
        <div className="w-full max-w-2xl space-y-8">
          <div className="flex items-center justify-center">
            <Image
              src="/assets/Main_logo.svg"
              alt="CVLab Logo"
              width={200}
              height={200}
              className="h-20 w-auto"
            />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-4xl font-normal text-gray-900">
              {t('createAccount')}
            </h2>
            <p className="text-base text-gray-600">{t('signupSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-[#f7f9fb] rounded-2xl p-6 shadow-sm">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className={`text-sm text-gray-700 block ${isRTL ? 'text-right' : ''}`}>{t('fullName')}</label>
              <div className="relative">
                <User className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  type="text"
                  placeholder={t('enterFullName')}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`h-12 bg-gray-50 border-gray-200 ${isRTL ? 'pr-11 text-right' : 'pl-11'}`}
                  autoComplete="name"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm text-gray-700 block ${isRTL ? 'text-right' : ''}`}>{t('emailAddress')}</label>
              <div className="relative">
                <Mail className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  type="email"
                  placeholder={t('enterEmail')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`h-12 bg-gray-50 border-gray-200 ${isRTL ? 'pr-11 text-right' : 'pl-11'}`}
                  autoComplete="email"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm text-gray-700 block ${isRTL ? 'text-right' : ''}`}>{t('password')}</label>
              <div className="relative">
                <Lock className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('enterPassword')}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`h-12 bg-gray-50 border-gray-200 ${isRTL ? 'pr-11 pl-12 text-right' : 'pl-11 pr-12'}`}
                  autoComplete="new-password"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{t('passwordStrength')}</span>
                    <span className={`font-medium ${passwordStrength.level === 1 ? 'text-red-500' : passwordStrength.level === 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.level >= 1 ? (passwordStrength.level === 1 ? 'bg-red-500' : passwordStrength.level === 2 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-200'}`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.level >= 2 ? (passwordStrength.level === 2 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-200'}`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.level >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className={`text-sm text-gray-700 block ${isRTL ? 'text-right' : ''}`}>{t('confirmPassword')}</label>
              <div className="relative">
                <Lock className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('reEnterPassword')}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`h-12 bg-gray-50 border-gray-200 ${isRTL ? 'pr-11 pl-12 text-right' : 'pl-11 pr-12'}`}
                  autoComplete="new-password"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked as boolean })}
                className="mt-1 border-gray-300"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                {t('agreeToTerms')}
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('creatingAccount') || 'Creating account...'}
                </>
              ) : (
                <>
                  <Image
                    src="/assets/create-account.svg"
                    alt="Create Account"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                  {t('createAccountBtn')}
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-700">
                {t('haveAccount')}
              </p>
              <div>
                <Link href="/signin" className="text-sm font-bold text-gray-900 hover:underline">
                  {t('signIn')}
                </Link>
              </div>
            </div>
          </form>

          <div className="flex justify-center">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              {language === 'en' ? 'English' : 'العربية'}
              <span className="text-gray-400">&#9662;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
