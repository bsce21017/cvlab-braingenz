import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about CV Summit — our mission to empower professionals with AI-driven resume optimization and career advancement tools.',
  alternates: {
    canonical: '/about-us',
  },
  openGraph: {
    title: 'About Us | CV Summit',
    description: 'Learn about CV Summit — our mission to empower professionals with AI-driven resume optimization and career advancement tools.',
  },
};

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
