import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prompt Management',
  robots: { index: false, follow: false },
};

export default function PromptManagementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
