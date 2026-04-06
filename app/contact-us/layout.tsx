import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the CV Summit team. We\'re here to help with questions about our AI resume optimization platform.',
  alternates: {
    canonical: '/contact-us',
  },
  openGraph: {
    title: 'Contact Us | CV Summit',
    description: 'Get in touch with the CV Summit team. We\'re here to help with questions about our AI resume optimization platform.',
  },
};

export default function ContactUsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
