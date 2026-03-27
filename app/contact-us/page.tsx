'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContactInfo from '@/components/contact/ContactInfo';
import FAQSection from '@/components/contact/FAQSection';
import ContactForm from '@/components/contact/ContactForm';
import { MessageCircle } from 'lucide-react';

export default function ContactUsPage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ur';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-brand-blue/[0.03] rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 pointer-events-none" />
          <div className="max-w-7xl mx-auto relative">
            <div className="max-w-xl animate-fade-up">
              {!isRTL && <span className="inline-block text-xs font-bold text-brand-blue tracking-[0.2em] uppercase mb-4">Get In Touch</span>}
              <h1 className="text-5xl font-bold text-foreground mb-4">{t('contact.title')}</h1>
              <p className="text-lg text-muted-foreground">{t('contact.subtitle')}</p>
            </div>
          </div>
        </section>

        {/* Bento grid */}
        <section className="pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Contact form — takes 7 cols */}
              <div className="lg:col-span-7 animate-fade-up-delay-1">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <ContactForm />
                </div>
              </div>

              {/* Right column — stacked cards */}
              <div className="lg:col-span-5 space-y-6 animate-fade-up-delay-2">
                {/* Contact info card */}
                <div className="bg-brand-blue rounded-2xl p-8 text-white">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-brand-yellow" />
                    </div>
                    <h3 className="text-lg font-bold">{t('contact.contactInfo')}</h3>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-bold text-brand-yellow uppercase tracking-wider mb-1">{t('contact.email')}</p>
                      <p className="text-blue-100/80 text-sm">{t('contact.emailValue')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-yellow uppercase tracking-wider mb-1">{t('contact.address')}</p>
                      <p className="text-blue-100/80 text-sm">{t('contact.addressFull')}</p>
                    </div>
                  </div>
                </div>

                {/* FAQ card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-8">
                  <FAQSection />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
