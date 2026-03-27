'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, FileDown, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { TemplateSelector, Template } from '@/components/resume/TemplateSelector';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { Button } from '@/components/ui/button';

import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import { getResumePreview, PreviewResponse, uploadPDFToS3 } from '@/lib/api';
import { downloadResumeAsWord } from '@/lib/downloadResume';
import { generateAndDownloadPDF, generatePDFBase64 } from '@/lib/generatePDF';
import { ResumeData } from '@/lib/resumeDataTypes';

export default function ResumePreviewPage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ur';
  const router = useRouter();
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('classic');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const templateRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log('[ResumePreviewPage] Template changed to:', selectedTemplate);
  }, [selectedTemplate]);

  useEffect(() => {
    const resumeId = sessionStorage.getItem('resumeId');
    if (!resumeId) { router.push('/'); return; }

    const fetchPreview = async () => {
      try {
        const data = await getResumePreview(parseInt(resumeId));
        console.log('Fetched preview data:', data);
        setPreviewData(data);
      } catch (err) {
        console.error('Error fetching preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preview');
      } finally { setLoading(false); }
    };

    fetchPreview();
  }, [router]);

  const handleResumeDataReady = (data: ResumeData | null, ref: React.RefObject<HTMLDivElement>) => {
    setResumeData(data);
    if (ref && ref.current) {
      (templateRef as React.MutableRefObject<HTMLDivElement | null>).current = ref.current;
    }

    const resumeId = sessionStorage.getItem('resumeId');
    if (data && resumeId) {
      const name = data.name || 'resume';
      const filename = `${name.replace(/\s+/g, '_')}_${selectedTemplate}.pdf`;
      generatePDFBase64(data, selectedTemplate)
        .then(pdfBase64 => uploadPDFToS3(parseInt(resumeId), pdfBase64, filename))
        .then(result => console.log('[ResumePreviewPage] PDF auto-uploaded to S3:', result))
        .catch(err => console.error('[ResumePreviewPage] S3 auto-upload failed:', err));
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (!resumeData) { alert('Resume data not available. Please wait a moment and try again.'); return false; }
      const name = resumeData.name || 'resume';
      const filename = `${name.replace(/\s+/g, '_')}_${selectedTemplate}.pdf`;
      await generateAndDownloadPDF(resumeData, selectedTemplate, filename);
      return false;
    } catch (error) {
      console.error('[Download] Error downloading PDF:', error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const handleDownloadWord = async () => {
    try {
      if (!resumeData) { alert('Resume data not available. Please wait a moment and try again.'); return false; }
      const name = resumeData.name || 'resume';
      const filename = `${name.replace(/\s+/g, '_')}_${selectedTemplate}.docx`;
      await downloadResumeAsWord(resumeData, selectedTemplate, filename);
      return false;
    } catch (error) {
      console.error('[Download] Error downloading Word:', error);
      alert(`Failed to download Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-light flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-muted-foreground text-sm">Loading optimized resume...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
          <Button onClick={() => router.push('/')} className="btn-magnetic bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl">
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand-blue-muted/10 to-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-brand-blue/[0.06] bg-white/80 backdrop-blur-md sticky top-0 z-40" dir={isRTL ? 'rtl' : 'ltr'}>
        <Link href="/" className="flex items-center" dir="ltr">
          <Image src="/assets/Main logo.svg" alt="CV Summit Logo" width={160} height={80} className="h-12 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        {/* Top bar with title and download buttons */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center shadow-sm">
              <Eye className="w-6 h-6 text-brand-yellow" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t('resumePreview.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('resumePreview.download')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
                try { await handleDownloadPDF(); } catch (err) { console.error(err); }
                return false;
              }}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="btn-magnetic gap-2 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl shadow-sm"
            >
              <FileDown className="h-4 w-4" />
              PDF
            </Button>
            <Button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
                try { await handleDownloadWord(); } catch (err) { console.error(err); }
                return false;
              }}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              variant="outline"
              className="gap-2 border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5 rounded-xl"
            >
              <FileDown className="h-4 w-4" />
              Word
            </Button>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] animate-fade-up-delay-1">
          {/* Sidebar — template selector */}
          <aside>
            <div className="sticky top-24 space-y-6">
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onTemplateChange={(template) => {
                  console.log('[ResumePreviewPage] Template selector clicked:', template);
                  setSelectedTemplate(template);
                }}
              />
            </div>
          </aside>

          {/* Preview area */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <ResumePreview
              key={selectedTemplate}
              optimizedText={previewData?.structured_data ? (previewData as any) : (previewData?.optimized_text || '')}
              template={selectedTemplate}
              onResumeDataReady={handleResumeDataReady}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
