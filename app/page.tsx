'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle, TrendingUp, Users, FileCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

function EmailVerifiedModal({ isOpen, onClose, t }: { isOpen: boolean; onClose: () => void; t: (key: string) => string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in-scale">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-brand-green-light rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-brand-green" />
          </div>
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-foreground">{t('emailVerifiedTitle')}</h3>
          <p className="text-muted-foreground">{t('emailVerifiedMessage')}</p>
          <button onClick={onClose} className="w-full h-12 btn-magnetic bg-brand-blue hover:bg-brand-blue-light text-white font-semibold rounded-xl transition-colors mt-4">
            {t('letsGetStarted')}
          </button>
        </div>
      </div>
    </div>
  );
}

function VerificationHandler({ onVerified }: { onVerified: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get('verified') === 'true') { onVerified(); window.history.replaceState({}, '', '/'); }
  }, [searchParams, onVerified]);
  return null;
}

/* Stats / social proof section */
function StatsSection({ t }: { t: (key: string) => string }) {
  const stats = [
    { icon: FileCheck, value: '10K+', label: t('resumesOptimized'), color: 'text-white' },
    { icon: TrendingUp, value: '70%', label: t('interviewRateIncrease'), color: 'text-brand-green' },
    { icon: Users, value: '5K+', label: t('happyUsers'), color: 'text-brand-yellow' },
  ];

  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-brand-blue-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,203,18,0.08),transparent_60%)]" />
      <div className="max-w-5xl mx-auto relative">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-brand-yellow mb-4">
            {t('trustedByProfessionals')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {t('numbersSpeakForThemselves')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center group">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 mb-5 transition-transform duration-500 group-hover:scale-110">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tight">{stat.value}</p>
              <p className="text-blue-200/50 text-sm font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const [showVerifiedModal, setShowVerifiedModal] = useState(false);
  const handleVerified = () => { setShowVerifiedModal(true); toast.success(t('emailVerified')); };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <EmailVerifiedModal isOpen={showVerifiedModal} onClose={() => setShowVerifiedModal(false)} t={t} />
      <Suspense fallback={null}>
        <VerificationHandler onVerified={handleVerified} />
      </Suspense>

      {/* Hero with gradient background */}
      <div
        className="relative"
        style={{ background: 'linear-gradient(180deg, #F0F4FA 0%, #FFFFFF 50%, #FFFFFF 100%)' }}
      >
        <Header />
        <HeroSection />
      </div>

      <main className="flex-1">
        <HowItWorks />
        <StatsSection t={t} />

        {/* CTA Section — white bg for contrast between dark stats and dark footer */}
        <section className="py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(9,61,127,0.03),transparent_60%)]" />
          <div className="max-w-3xl mx-auto relative text-center space-y-6">
            <span className="inline-block text-xs font-bold text-brand-blue tracking-[0.2em] uppercase">{t('getStartedToday')}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('readyToTransform')}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t('ctaSubtitle')}</p>
            <Link
              href="/"
              className="btn-magnetic inline-flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-light text-white px-10 py-4 rounded-xl font-bold text-sm transition-colors duration-300 mt-2"
            >
              {t('getStarted')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
