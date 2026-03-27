'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

function SignInContent() {
  const { language, setLanguage, t } = useLanguage();
  const isRTL = language === 'ur';
  const { signIn, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const adminRoles = ['admin', 'service_role', 'super_admin'];
      if (adminRoles.includes(user.role)) {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/';
      }
    }
  }, [user, authLoading]);

  const clearPassword = () => {
    setFormData(prev => ({ ...prev, password: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('invalid email or password') || errorMessage.includes('invalid credentials')) {
          toast.error(t('wrongPassword') || "That password doesn't look right. Give it another try!", {
            duration: 4000,
          });
          setError(t('invalidCredentials') || 'Incorrect email or password.');
        } else if (errorMessage.includes('deactivated')) {
          const errorMsg = t('accountDeactivated') || 'Your account has been deactivated.';
          toast.error(errorMsg, { duration: 6000 });
          setError(errorMsg);
        } else {
          toast.error(t('somethingWentWrong') || 'Something went wrong. Please try again.', {
            duration: 4000,
          });
          setError(error.message || t('failedToSignIn') || 'Failed to sign in.');
        }
        clearPassword();
      } else {
        toast.success(t('welcomeBack') || 'Welcome back!', { duration: 3000 });
        // Redirect handled by useEffect when user state updates
      }
    } catch (err) {
      toast.error(t('oopsSomethingWrong') || 'Oops! Something went wrong.', { duration: 4000 });
      setError(t('unexpectedError') || 'An unexpected error occurred.');
      clearPassword();
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
      {/* Left visual panel */}
      <div className="relative hidden lg:block">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/assets/background-image.png')",
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '110%',
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 flex h-full flex-col justify-center px-14 text-white space-y-4">
          <h1 className="text-5xl font-normal leading-tight max-w-xl">
            {t('optimizeCV')}
          </h1>
          <p className="text-lg text-gray-200 leading-relaxed max-w-xl">
            {t('transformResume')}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-[#f7f9fb] px-6 py-12">
        <div className="w-full max-w-xl space-y-8">
          <div className="flex items-center justify-center">
            <Image
              src="/assets/Main logo.svg"
              alt="CV Summit Logo"
              width={200}
              height={120}
              className="h-20 w-auto"
            />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-4xl font-normal text-gray-900">
              {t('welcomeBack')}
            </h2>
            <p className="text-base text-gray-600">
              {t('loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-[#f7f9fb] rounded-2xl p-6 shadow-sm">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className={`text-sm text-gray-700 block ${isRTL ? 'text-right' : ''}`}>
                {t('emailAddress')}
              </label>
              <div className="relative">
                <Mail className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  type="email"
                  placeholder={t('enterEmail')}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`h-12 bg-gray-50 border-gray-200 ${isRTL ? 'pr-11 text-right' : 'pl-11'}`}
                  autoComplete="email"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm text-gray-700 block ${isRTL ? 'text-right' : ''}`}>
                {t('password')}
              </label>
              <div className="relative">
                <Lock className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('enterPassword')}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`h-12 bg-gray-50 border-gray-200 ${isRTL ? 'pr-11 pl-12 text-right' : 'pl-11 pr-12'}`}
                  autoComplete="current-password"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, rememberMe: checked as boolean })
                  }
                  className="border-gray-300"
                />
                <label
                  htmlFor="remember"
                  className="text-gray-600 cursor-pointer"
                >
                  {t('rememberMe')}
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-black hover:bg-gray-900 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('signingIn') || 'Signing in...'}
                </>
              ) : (
                <>
                  {isRTL ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                  {t('login')}
                </>
              )}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-700">
                {t('noAccount')}
              </p>
              <div>
                <Link
                  href="/signup"
                  className="text-sm font-bold text-gray-900 hover:underline"
                >
                  {t('signUp')}
                </Link>
              </div>
            </div>
          </form>

          <div className="flex justify-center">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              {language === 'en' ? 'English' : 'اردو'}
              <span className="text-gray-400">&#9662;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return <SignInContent />;
}
