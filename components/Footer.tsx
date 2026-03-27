'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-brand-blue-dark text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1 space-y-5">
            <Image
              src="/assets/Main logo.svg"
              alt="CV Summit Logo"
              width={160}
              height={80}
              className="h-12 w-auto brightness-0 invert"
            />
            <p className="text-blue-200/50 text-sm leading-relaxed max-w-xs">
              {t('perfectingResumes')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-brand-yellow">{t('quickLinks')}</h4>
            <ul className="space-y-3">
              {[
                { href: '/', label: t('home') },
                { href: '/about-us', label: t('about') },
                { href: '/contact-us', label: t('contact') },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-blue-200/60 hover:text-white text-sm transition-colors duration-300 inline-flex items-center gap-1 group">
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-5">
            <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-brand-yellow">{t('legal')}</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy-policy" className="text-blue-200/60 hover:text-white text-sm transition-colors duration-300">
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-blue-200/60 hover:text-white text-sm transition-colors duration-300">
                  {t('termsOfService')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-brand-yellow">Contact</h4>
            <div className="space-y-3 text-sm text-blue-200/60">
              <p>{t('contact.emailValue')}</p>
              <p>{t('contact.addressFull')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-blue-200/30 text-xs">{t('copyright')}</p>
          <a href="https://braingenz.com" target="_blank" rel="noopener noreferrer" className="text-blue-200/30 text-xs hover:text-brand-yellow transition-colors">Powered by BrainGenz</a>
        </div>
      </div>
    </footer>
  );
}
