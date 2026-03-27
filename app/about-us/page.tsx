'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Sparkles, Target, HelpCircle, FileEdit } from 'lucide-react';
import Image from 'next/image';

export default function AboutUsPage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ur';

  const steps = [
    { iconSrc: '/assets/upload icon.png', icon: null, title: t('aboutUsStep1Title'), desc: t('aboutUsStep1Desc'), color: 'bg-brand-blue' },
    { iconSrc: '/assets/ai analyses brain icon.png', icon: null, title: t('aboutUsStep2Title'), desc: t('aboutUsStep2Desc'), color: 'bg-brand-green' },
    { iconSrc: null, icon: HelpCircle, title: t('aboutUsStep3Title'), desc: t('aboutUsStep3Desc'), color: 'bg-brand-yellow' },
    { iconSrc: null, icon: FileEdit, title: t('aboutUsStep4Title'), desc: t('aboutUsStep4Desc'), color: 'bg-brand-blue' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main className="flex-1">
        {/* Hero — editorial asymmetric */}
        <section className="pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6 animate-fade-up">
                {!isRTL && <span className="inline-block text-xs font-bold text-brand-blue tracking-[0.2em] uppercase">{t('about')}</span>}
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  {t('aboutUsTitle')}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t('aboutUsWhoWeAreText')}
                </p>
              </div>
              <div className="animate-fade-up-delay-1">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-brand-blue/10 via-brand-yellow/5 to-brand-green/5 rounded-3xl blur-2xl" />
                  <div className="relative bg-white rounded-2xl border border-gray-100 shadow-xl shadow-brand-blue/5 p-10 text-center">
                    <div className="w-20 h-20 bg-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-brand-yellow" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('aboutUsSubtitle')}</h3>
                    <p className="text-sm text-muted-foreground">{isRTL ? 'AI سے چلنے والا CV بہتری پلیٹ فارم' : 'AI-Powered CV Enhancement Platform'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works — numbered list, editorial */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-lg mb-16">
              {!isRTL && <span className="inline-block text-xs font-bold text-brand-blue tracking-[0.2em] uppercase mb-4">Our Process</span>}
              <h2 className="text-4xl font-bold text-foreground mb-4">{t('aboutUsHowItWorksTitle')}</h2>
              <p className="text-muted-foreground">{t('aboutUsHowItWorksSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="group relative">
                  <div className="absolute -inset-px bg-gradient-to-br from-gray-200 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-white border border-gray-100 rounded-2xl p-7 flex gap-5 transition-all duration-500 group-hover:shadow-lg group-hover:-translate-y-0.5">
                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:scale-110`}>
                      {step.iconSrc ? (
                        <Image src={step.iconSrc} alt={step.title} width={24} height={24} className="w-6 h-6" />
                      ) : step.icon ? (
                        <step.icon className="w-6 h-6 text-white" />
                      ) : null}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-brand-blue mb-1 block">Step {index + 1}</span>
                      <h3 className="text-lg font-bold text-foreground mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission — white band for contrast before dark footer */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(9,61,127,0.03),transparent_60%)]" />
          <div className="max-w-4xl mx-auto relative text-center space-y-6">
            <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center mx-auto">
              <Target className="w-8 h-8 text-brand-yellow" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('aboutUsMissionTitle')}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">{t('aboutUsMissionText')}</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
