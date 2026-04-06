import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Questions',
  robots: { index: false, follow: false },
};

export default function QuestionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
