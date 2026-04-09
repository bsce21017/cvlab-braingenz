'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HowItWorks() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ur';

  const steps = [
    {
      iconSrc: '/assets/upload icon.png',
      title: t('step1Title'),
      description: t('step1Desc'),
      color: 'from-brand-blue to-brand-blue-light',
      bg: 'bg-brand-blue',
      num: '01',
    },
    {
      iconSrc: '/assets/ai analyses brain icon.png',
      title: t('step2Title'),
      description: t('step2Desc'),
      color: 'from-brand-green to-emerald-500',
      bg: 'bg-brand-green',
      num: '02',
    },
    {
      iconSrc: '/assets/dowload icon.png',
      title: t('step3Title'),
      description: t('step3Desc'),
      color: 'from-brand-yellow to-amber-400',
      bg: 'bg-brand-yellow',
      num: '03',
    },
  ];

  return (
    <section className="py-28 lg:py-36 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(9,61,127,0.03),transparent_50%)]" />

      <div className="max-w-6xl mx-auto relative">
        {/* Section header — left aligned (editorial style) */}
        <div className={`max-w-xl mb-20 animate-fade-up ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
          {!isRTL && (
            <span className="inline-block text-xs font-bold text-brand-blue tracking-[0.2em] uppercase mb-4">
              {t('howItWorksLabel')}
            </span>
          )}
          <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            {t('howItWorks')}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t('stepSubtitle')}
          </p>
        </div>

        {/* Steps — staggered cards */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`animate-fade-up-delay-${index + 1}`}
                style={{ marginTop: index === 1 ? '2rem' : index === 2 ? '4rem' : '0' }}
              >
                {/* Step number */}
                <div className="flex items-center gap-4 mb-6">
                  <span className={`text-[4rem] font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent leading-none`}>
                    {step.num}
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Card */}
                <div className="group relative">
                  <div className="absolute -inset-px bg-gradient-to-br from-gray-200 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-white border border-gray-100 rounded-2xl p-7 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-brand-blue/5 group-hover:-translate-y-1">
                    {/* Icon */}
                    <div className={`w-14 h-14 ${step.bg} rounded-2xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      <Image src={step.iconSrc} alt={step.title} width={28} height={28} className="w-7 h-7" />
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-3 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
