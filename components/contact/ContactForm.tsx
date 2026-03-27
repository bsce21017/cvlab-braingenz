'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function ContactForm() {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/v1/claims/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to send message');
      }

      setIsSuccess(true);
      toast.success(t('contact.messageSent') || 'Your message has been sent successfully!');
      setFormData({ full_name: '', email: '', phone: '', message: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t('contact.thankYou') || 'Thank you!'}
          </h3>
          <p className="text-gray-600">
            {t('contact.messageSentDesc') || 'Your message has been sent. We will get back to you soon.'}
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="mt-6 px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light btn-magnetic transition-colors"
          >
            {t('contact.sendAnother') || 'Send another message'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">{t('contact.sendMessage')}</h3>
        <p className="text-sm text-gray-600">{t('contact.replyTime')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('contact.fullName')}
          </label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder={t('contact.fullNamePlaceholder')}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-transparent placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('contact.email')}
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={t('contact.emailPlaceholder')}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-transparent placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('contact.phoneNumber')}
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder={t('contact.phonePlaceholder')}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-transparent placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('contact.message')}
          </label>
          <textarea
            rows={6}
            required
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder={t('contact.messagePlaceholder')}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-transparent placeholder:text-gray-400 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light btn-magnetic transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {isSubmitting ? (t('contact.sending') || 'Sending...') : t('contact.sendBtn')}
        </button>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Image
            src="/assets/contact-us-shield.svg"
            alt="Shield"
            width={16}
            height={16}
            className="w-4 h-4"
          />
          <span>{t('contact.confidential')}</span>
        </div>
      </form>
    </div>
  );
}
