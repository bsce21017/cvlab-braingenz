import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Processing',
  robots: { index: false, follow: false },
};

export default function ProcessingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
