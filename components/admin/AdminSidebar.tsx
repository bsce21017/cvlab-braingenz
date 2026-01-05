'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  FileText,
  Users,
  AlertCircle,
  Settings,
} from 'lucide-react';
import ClaimsOverview from '@/components/admin/claims/ClaimsOverview';

export default function AdminSidebar() {
  const { t, language } = useLanguage();
  const pathname = usePathname();

  const menuItems = [
    {
      label: t('admin.dashboard'),
      href: '/admin/dashboard',
      icon: BarChart3,
    },
    {
      label: t('admin.prompts'),
      href: '/admin/prompts',
      icon: MessageSquare,
    },
    {
      label: t('admin.resumes'),
      href: '/admin/resumes',
      icon: FileText,
    },
    {
      label: t('admin.users'),
      href: '/admin/users',
      icon: Users,
    },
    {
      label: t('admin.claims'),
      href: '/admin/claims',
      icon: AlertCircle,
    },
    {
      label: t('admin.settings'),
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  const isRTL = language === 'ar';

  return (
    <aside className={`w-56 bg-white border-r border-gray-200 h-screen overflow-y-auto ${isRTL ? 'border-l border-r-0' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin/dashboard" className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center overflow-hidden">
            <Image
              src="/assets/admin_logo.png"
              alt="AdminHub logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="font-bold text-gray-900">{t('admin.adminHub')}</h1>
            <p className="text-xs text-gray-500">{t('admin.admin')}</p>
          </div>
        </Link>
      </div>

      <nav className="space-y-1 px-4 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-bold'
                  : 'text-gray-700 hover:bg-gray-100 font-medium'
              }`}
              dir="ltr"
            >
              {isRTL ? (
                <>
                  <span className={`flex-1 text-left ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                </>
              ) : (
                <>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
                  <span className={`flex-1 ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Claims Overview - Only show on Claims page */}
      {pathname === '/admin/claims' || pathname.startsWith('/admin/claims/') ? (
        <div className="px-4 py-4 border-t border-gray-200">
          <ClaimsOverview />
        </div>
      ) : null}
    </aside>
  );
}
