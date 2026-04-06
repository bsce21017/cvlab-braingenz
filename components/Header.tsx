'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, Menu, X } from 'lucide-react';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Header() {
  const { language, t } = useLanguage();
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setShowSignOutDialog(false);
      toast.success(t('signOutSuccess') || 'You have been signed out successfully.');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(t('signOutError') || 'Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/about-us', label: t('about') },
    { href: '/contact-us', label: t('contact') },
  ];

  return (
    <>
      {/* Sign Out Dialog */}
      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-brand-blue-muted rounded-full flex items-center justify-center">
                <LogOut className="w-8 h-8 text-brand-blue" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">
              {t('signOutConfirmTitle') || 'Sign Out'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('signOutConfirmMessage') || 'Are you sure you want to sign out of your account?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button variant="outline" onClick={() => setShowSignOutDialog(false)} disabled={isSigningOut} className="flex-1">
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSignOut} disabled={isSigningOut} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {isSigningOut ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('signingOut')}</> : t('signOut') || 'Sign Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Island Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <div
          className={`max-w-5xl mx-auto transition-all duration-500 ${
            scrolled
              ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-brand-blue/5 rounded-2xl border border-white/50'
              : 'bg-white/60 backdrop-blur-md rounded-2xl'
          }`}
        >
          <div className="flex items-center justify-between h-16 px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0 group">
              <Image
                src="/assets/Main logo.svg"
                alt="CV Summit Logo"
                width={160}
                height={80}
                className="h-12 w-auto transition-transform duration-500 group-hover:scale-[1.03]"
                priority
              />
            </Link>

            {/* Center nav pills */}
            <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 rounded-full px-1.5 py-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 ${
                    pathname === link.href
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-gray-600 hover:text-brand-blue hover:bg-white/80'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-brand-blue transition-colors rounded-full hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile nav dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden px-4 pb-4 animate-fade-up">
              <nav className="flex flex-col gap-1 bg-gray-50 rounded-xl p-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-[14px] font-medium py-2.5 px-4 rounded-lg transition-all duration-200 ${
                      pathname === link.href
                        ? 'text-white bg-brand-blue'
                        : 'text-gray-600 hover:text-brand-blue hover:bg-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-24" />
    </>
  );
}
