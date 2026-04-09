'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight, ArrowLeft, Shield, Zap, Award } from 'lucide-react';
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
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });

  useEffect(() => {
    if (!authLoading && user) {
      const adminRoles = ['admin', 'service_role', 'super_admin'];
      window.location.href = adminRoles.includes(user.role) ? '/admin/dashboard' : '/';
    }
  }, [user, authLoading]);

  const clearPassword = () => setFormData(prev => ({ ...prev, password: '' }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('invalid email or password') || msg.includes('invalid credentials')) {
          toast.error(t('wrongPassword') || "That password doesn't look right.", { duration: 4000 });
          setError(t('invalidCredentials') || 'Incorrect email or password.');
        } else if (msg.includes('deactivated')) {
          const errorMsg = t('accountDeactivated') || 'Your account has been deactivated.';
          toast.error(errorMsg, { duration: 6000 }); setError(errorMsg);
        } else {
          toast.error(t('somethingWentWrong') || 'Something went wrong.', { duration: 4000 });
          setError(error.message || t('failedToSignIn'));
        }
        clearPassword();
      } else {
        toast.success(t('welcomeBack') || 'Welcome back!', { duration: 3000 });
      }
    } catch {
      toast.error(t('oopsSomethingWrong') || 'Oops! Something went wrong.', { duration: 4000 });
      setError(t('unexpectedError') || 'An unexpected error occurred.');
      clearPassword();
    } finally { setIsSubmitting(false); }
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
    </div>
  );

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — brand showcase */}
      <div className="relative hidden lg:flex flex-col justify-between bg-brand-blue overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(249,203,18,0.12),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 p-12 pt-16">
          <Image src="/assets/Main logo.svg" alt="CV Summit" width={160} height={80} className="h-12 w-auto brightness-0 invert" />
        </div>

        <div className="relative z-10 px-12 flex-1 flex flex-col justify-center space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              {t('optimizeCV')}
            </h1>
            <p className="text-blue-100/70 text-lg leading-relaxed max-w-md">
              {t('transformResume')}
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-4">
            {[
              { icon: Shield, text: 'ATS-optimized formatting' },
              { icon: Zap, text: 'AI-powered analysis in minutes' },
              { icon: Award, text: 'Professional-grade results' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-brand-yellow" />
                </div>
                <span className="text-white/80 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-12 pb-10">
          <p className="text-blue-200/30 text-xs">CV Summit — AI Resume Optimization Platform</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md space-y-8 animate-fade-up">
          <div className="lg:hidden flex justify-center mb-4">
            <Image src="/assets/Main logo.svg" alt="CV Summit Logo" width={160} height={80} className="h-14 w-auto" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">{t('welcomeBack')}</h2>
            <p className="text-sm text-muted-foreground">{t('loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">{error}</div>}

            <div className="space-y-1.5">
              <label className={`text-sm text-foreground font-medium block ${isRTL ? 'text-right' : ''}`}>{t('emailAddress')}</label>
              <div className="relative">
                <Mail className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3.5' : 'left-3.5'}`} />
                <Input type="email" placeholder={t('enterEmail')} value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-brand-blue focus:ring-brand-blue/20 text-sm ${isRTL ? 'pr-10 text-right' : 'pl-10'}`}
                  autoComplete="email" dir={isRTL ? 'rtl' : 'ltr'} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-sm text-foreground font-medium block ${isRTL ? 'text-right' : ''}`}>{t('password')}</label>
              <div className="relative">
                <Lock className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3.5' : 'left-3.5'}`} />
                <Input type={showPassword ? 'text' : 'password'} placeholder={t('enterPassword')} value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-brand-blue focus:ring-brand-blue/20 text-sm ${isRTL ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10'}`}
                  autoComplete="current-password" dir={isRTL ? 'rtl' : 'ltr'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isRTL ? 'left-3' : 'right-3'}`}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={formData.rememberMe}
                  onCheckedChange={(c) => setFormData({ ...formData, rememberMe: c as boolean })}
                  className="border-gray-300 data-[state=checked]:bg-brand-blue data-[state=checked]:border-brand-blue rounded" />
                <label htmlFor="remember" className="text-muted-foreground cursor-pointer text-xs">{t('rememberMe')}</label>
              </div>
              <Link href="/forgot-password" className="text-brand-blue hover:text-brand-blue-light transition-colors text-xs font-semibold">{t('forgotPassword')}</Link>
            </div>

            <Button type="submit" disabled={isSubmitting}
              className="w-full h-11 btn-magnetic bg-brand-blue hover:bg-brand-blue-light text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />{t('signingIn')}</>
                : <>{isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}{t('login')}</>}
            </Button>

            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">{t('noAccount')}{' '}
                <Link href="/signup" className="font-bold text-brand-blue hover:underline">{t('signUp')}</Link>
              </p>
            </div>
          </form>

          <div className="flex justify-center">
            <button onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="text-xs text-muted-foreground hover:text-brand-blue transition-colors flex items-center gap-1">
              {language === 'en' ? 'English' : 'اردو'}<span className="text-gray-400">&#9662;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() { return <SignInContent />; }
