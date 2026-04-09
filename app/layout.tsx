import './globals.css';
import type { Metadata } from 'next';
import { Manrope, Gulzar } from 'next/font/google';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/JsonLd';
import { DynamicHtmlLang } from '@/components/DynamicHtmlLang';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cvsummit.com';

const manrope = Manrope({ subsets: ['latin'] });
const gulzar = Gulzar({
  subsets: ['arabic'],
  weight: ['400'],
  variable: '--font-gulzar',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'CV Summit - AI-Powered Resume Optimization',
    template: '%s | CV Summit',
  },
  description: 'Transform your resume with CV Summit\'s intelligent AI-powered optimization. Upload your CV and get expert AI analysis, targeted improvements, and a professionally optimized resume.',
  keywords: ['resume optimization', 'CV builder', 'AI resume', 'career optimization', 'resume review', 'CV enhancement'],
  authors: [{ name: 'CV Summit' }],
  alternates: {
    canonical: '/',
    languages: {
      'en': '/',
      'ur': '/?lang=ur',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'CV Summit',
    title: 'CV Summit - AI-Powered Resume Optimization',
    description: 'Transform your resume with CV Summit\'s intelligent AI-powered optimization. Upload your CV and get expert AI analysis, targeted improvements, and a professionally optimized resume.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CV Summit - AI-Powered Resume Optimization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CV Summit - AI-Powered Resume Optimization',
    description: 'Transform your resume with CV Summit\'s intelligent AI-powered optimization. Upload your CV and get expert AI analysis.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className={`${manrope.className} ${gulzar.variable}`} suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>
            <DynamicHtmlLang />
            {children}
            <Toaster position="top-center" richColors />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
