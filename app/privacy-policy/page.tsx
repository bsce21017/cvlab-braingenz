'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ur';

  const sections = [
    {
      title: 'Information We Collect',
      content: `When you use CV Summit, we may collect the following types of information:

• Personal information you provide when creating an account (name, email address)
• Resume and CV files you upload for optimization
• Answers to follow-up questions used to tailor your optimized resume
• Usage data such as pages visited, features used, and interaction patterns
• Device and browser information collected automatically through standard web technologies`,
    },
    {
      title: 'How We Use Your Information',
      content: `We use the information we collect to:

• Provide and improve our AI-powered resume optimization services
• Analyze your resume and generate targeted improvement recommendations
• Create optimized versions of your CV based on your input and career goals
• Communicate with you about your account and our services
• Ensure the security and integrity of our platform
• Comply with legal obligations`,
    },
    {
      title: 'Resume Data Processing',
      content: `Your resume data is central to our service. Here is how we handle it:

• Uploaded resumes are processed using AI models to extract, analyze, and optimize content
• Resume data is stored securely using encrypted cloud storage (Azure Blob Storage)
• We do not sell, share, or distribute your resume content to third parties
• AI-generated optimizations are based solely on your uploaded content and your answers to follow-up questions
• You can request deletion of your resume data at any time by contacting our support team`,
    },
    {
      title: 'Data Security',
      content: `We implement industry-standard security measures to protect your data:

• All data is transmitted over encrypted connections (HTTPS/TLS)
• Resume files are stored in encrypted cloud storage
• Access to user data is restricted to authorized personnel only
• We use JWT-based authentication to secure your account
• Regular security reviews are conducted to maintain data protection standards`,
    },
    {
      title: 'Cookies and Tracking',
      content: `CV Summit uses minimal cookies and tracking:

• Session cookies to maintain your login state
• Language preference cookies to remember your selected language (English or Urdu)
• We do not use third-party advertising cookies
• No personal data is shared with external analytics or advertising platforms`,
    },
    {
      title: 'Third-Party Services',
      content: `We use the following third-party services to operate our platform:

• Cloud hosting and storage providers (Microsoft Azure) for secure data storage
• AI language model providers (Anthropic, OpenAI) for resume analysis and optimization
• These providers process data in accordance with their own privacy policies and our data processing agreements`,
    },
    {
      title: 'Your Rights',
      content: `You have the following rights regarding your personal data:

• Access: Request a copy of the personal data we hold about you
• Correction: Request correction of inaccurate personal data
• Deletion: Request deletion of your account and associated data
• Portability: Request your data in a machine-readable format
• Withdrawal of consent: Withdraw consent for data processing at any time

To exercise any of these rights, please contact us at our support email.`,
    },
    {
      title: 'Data Retention',
      content: `We retain your data for as long as your account is active or as needed to provide our services. If you delete your account, we will remove your personal data and uploaded resumes within 30 days, except where retention is required by law.`,
    },
    {
      title: 'Children\'s Privacy',
      content: `CV Summit is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child under 16, we will take steps to delete such information promptly.`,
    },
    {
      title: 'Changes to This Policy',
      content: `We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify users of material changes by posting a notice on our website. Your continued use of CV Summit after changes are posted constitutes acceptance of the updated policy.`,
    },
    {
      title: 'Contact Us',
      content: `If you have any questions or concerns about this Privacy Policy or our data practices, please contact us through our Contact Us page or email us at our support address.`,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9FC]" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-brand-blue-muted/40 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-blue rounded-2xl mb-6">
              <Shield className="w-10 h-10 text-brand-yellow" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {t('privacyPolicy')}
            </h1>
            <p className="text-base text-gray-600 mb-2">
              Your privacy is important to us. This policy explains how we handle your data.
            </p>
            <p className="text-sm text-gray-500">
              Last updated: April 2026
            </p>
          </div>
        </section>

        {/* Privacy Content */}
        <section className="pt-0 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {sections.map((section, index) => (
                <div key={index} className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    {section.title}
                  </h2>
                  <div className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
