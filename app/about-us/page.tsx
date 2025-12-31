'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import { Sparkles, Target, Zap, Shield, Users, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function AboutUsPage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <div className="flex justify-end px-6 pt-1">
        <LanguageSwitcher />
      </div>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-normal text-gray-900 mb-4">
              {t('aboutUsTitle')}
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              {t('aboutUsSubtitle')}
            </p>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="pt-0 pb-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-normal text-gray-900">
                    {t('aboutUsMissionTitle')}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t('aboutUsMissionText')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-normal text-gray-900">
                    {t('aboutUsVisionTitle')}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t('aboutUsVisionText')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="pt-0 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-2 mb-12">
              <h2 className="text-4xl font-normal text-gray-900">
                {t('aboutUsWhatWeDoTitle')}
              </h2>
              <p className="text-base text-gray-600">{t('aboutUsWhatWeDoSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-normal text-gray-900 leading-tight">
                    {t('aboutUsAiAnalysisTitle')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('aboutUsAiAnalysisText')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-normal text-gray-900 leading-tight">
                    {t('aboutUsPersonalizedTitle')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('aboutUsPersonalizedText')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-normal text-gray-900 leading-tight">
                    {t('aboutUsProfessionalTitle')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('aboutUsProfessionalText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section - Matching landing page style */}
        <section className="pt-0 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-4xl font-normal text-gray-900">
                {t('aboutUsHowItWorksTitle')}
              </h2>
              <p className="text-base text-gray-600">{t('aboutUsHowItWorksSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                  <Image 
                    src="/assets/upload icon.png"
                    alt="Upload"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-normal text-gray-900 leading-tight">
                    1. {t('step1Title') || 'Upload Your Resume'}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('step1Desc') || 'Simply drag and drop your resume or click to upload. We support all major formats.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                  <Image 
                    src="/assets/ai analyses brain icon.png"
                    alt="AI Analysis"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-normal text-gray-900 leading-tight">
                    2. {t('step2Title') || 'AI Analyzes & Improves'}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('step2Desc') || 'Our AI scans your resume for improvements in grammar, keywords, and formatting.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center">
                  <Image 
                    src="/assets/dowload icon.png"
                    alt="Download"
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-normal text-gray-900 leading-tight">
                    3. {t('step3Title') || 'Download Optimized Version'}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('step3Desc') || 'Get your professionally optimized resume ready to impress recruiters.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="pt-0 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-4xl font-normal text-gray-900">
                {t('aboutUsWhyChooseTitle')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-normal text-gray-900 mb-2 leading-tight">
                    {t('aboutUsZeroFabricationTitle')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('aboutUsZeroFabricationText')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-normal text-gray-900 mb-2 leading-tight">
                    {t('aboutUsFastProcessingTitle')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('aboutUsFastProcessingText')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-normal text-gray-900 mb-2 leading-tight">
                    {t('aboutUsAtsOptimizedTitle')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('aboutUsAtsOptimizedText')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-normal text-gray-900 mb-2 leading-tight">
                    {t('aboutUsPersonalizedApproachTitle')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t('aboutUsPersonalizedApproachText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="pt-0 pb-20 px-4 sm:px-6 lg:px-8 bg-black">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-normal text-white mb-4">
              {t('aboutUsCtaTitle')}
            </h2>
            <p className="text-base text-gray-300 mb-8">
              {t('aboutUsCtaSubtitle')}
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 h-12 px-8 text-base font-normal">
                {t('getStarted') || 'Get Started'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
