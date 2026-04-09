'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export function ContactFaqJsonLd() {
  const { t } = useLanguage();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: t('contact.faq1'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CV Summit uses advanced AI to analyze your resume, identify areas for improvement, and generate an optimized version with better formatting, keywords, and content tailored to your target role.',
        },
      },
      {
        '@type': 'Question',
        name: t('contact.faq2'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, your data is encrypted and stored securely. We use industry-standard security practices to protect your personal information and resume data. Your files are never shared with third parties.',
        },
      },
      {
        '@type': 'Question',
        name: t('contact.faq3'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The AI analysis and optimization process typically takes just a few minutes. After uploading your resume and answering a few targeted questions, you will receive your optimized CV shortly.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
