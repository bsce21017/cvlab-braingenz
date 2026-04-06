import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms and conditions for using CV Summit\'s AI-powered resume optimization services.',
  alternates: {
    canonical: '/terms-of-service',
  },
  openGraph: {
    title: 'Terms of Service | CV Summit',
    description: 'Read the terms and conditions for using CV Summit\'s AI-powered resume optimization services.',
  },
};

export default function TermsOfServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
