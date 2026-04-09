import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume Preview',
  robots: { index: false, follow: false },
};

export default function ResumePreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
