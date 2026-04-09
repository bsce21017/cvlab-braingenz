'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ProcessingAnimation from '@/components/processing/ProcessingAnimation';
import ProgressBar from '@/components/processing/ProgressBar';
import ProTip from '@/components/processing/ProTip';

import { useLanguage } from '@/contexts/LanguageContext';
import { getResumeStatus, StatusResponse } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';

function ProcessingContent() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ur';
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'optimization';

  const [progress, setProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const targetProgressRef = useRef(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const animateProgress = () => {
      setDisplayProgress(prev => {
        const target = targetProgressRef.current;
        const diff = target - prev;
        if (Math.abs(diff) < 0.5) return target;
        return prev + diff * 0.08;
      });
      animationFrameRef.current = requestAnimationFrame(animateProgress);
    };
    animationFrameRef.current = requestAnimationFrame(animateProgress);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, []);

  useEffect(() => { targetProgressRef.current = progress; }, [progress]);

  const getBaseProgress = useCallback((status: StatusResponse, isAnalysis: boolean): number => {
    if (isAnalysis) {
      if (status.questions_available) return 100;
      if (status.analysis_complete) return 75;
      if (status.extracted_text_length && status.extracted_text_length > 0) return 35;
      return 5;
    } else {
      if (status.optimization_complete) return 100;
      if (status.answers_submitted) return 40;
      return 5;
    }
  }, []);

  useEffect(() => {
    const resumeId = sessionStorage.getItem('resumeId');
    if (!resumeId) { router.push('/'); return; }

    let isMounted = true;
    let pollInterval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    let lastMilestone = 0;

    const pollStatus = async () => {
      try {
        const status = await getResumeStatus(parseInt(resumeId));
        if (!isMounted) return;
        const isAnalysis = mode === 'analysis';
        const baseProgress = getBaseProgress(status, isAnalysis);
        if (baseProgress > lastMilestone) { lastMilestone = baseProgress; setProgress(baseProgress); }

        if (isAnalysis && status.questions_available) {
          clearInterval(pollInterval); clearInterval(progressInterval); setProgress(100);
          setTimeout(() => { if (isMounted) router.push('/questions'); }, 800);
          return;
        }
        if (!isAnalysis && status.optimization_complete) {
          clearInterval(pollInterval); clearInterval(progressInterval); setProgress(100);
          setTimeout(() => { if (isMounted) router.push('/resume-preview'); }, 800);
          return;
        }
        if (status.status === 'failed') {
          clearInterval(pollInterval); clearInterval(progressInterval);
          setError(status.error_message || 'Processing failed. Please try uploading again.');
          return;
        }
      } catch (err) { console.error('Status polling error:', err); }
    };

    const incrementProgress = () => {
      setProgress(prev => {
        const milestones = mode === 'analysis' ? [5, 35, 75, 100] : [5, 40, 100];
        let nextMilestone = 100;
        for (const m of milestones) { if (m > prev) { nextMilestone = m; break; } }
        const maxProgress = nextMilestone - 3;
        if (prev >= maxProgress) return prev;
        return Math.min(prev + 0.3 + Math.random() * 0.5, maxProgress);
      });
    };

    pollStatus();
    pollInterval = setInterval(pollStatus, 2000);
    progressInterval = setInterval(incrementProgress, 500);

    return () => { isMounted = false; clearInterval(pollInterval); clearInterval(progressInterval); };
  }, [router, mode, getBaseProgress]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-white via-brand-blue-muted/10 to-white">
      {/* Ambient decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-brand-blue/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-yellow/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[300px] h-[300px] bg-brand-green/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Simple header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between" dir={isRTL ? 'rtl' : 'ltr'}>
        <Link href="/" className="flex items-center" dir="ltr">
          <Image src="/assets/Main logo.svg" alt="CV Summit Logo" width={160} height={80} className="h-12 w-auto" />
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Main content — vertically centered */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20 relative" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-2xl space-y-12">
          {/* Animation */}
          <div className="animate-fade-up">
            <ProcessingAnimation />
          </div>

          {/* Progress bar */}
          <div className="animate-fade-up-delay-1">
            <ProgressBar
              progress={Math.round(displayProgress)}
              label={mode === 'optimization' ? t('processingLabelFinal') : t('processingLabelInitial')}
            />
          </div>

          {/* Text content */}
          <div className={`text-center animate-fade-up-delay-2 ${isRTL ? 'space-y-8' : 'space-y-5'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <h1 className={`text-foreground font-bold max-w-xl mx-auto ${isRTL ? 'text-xl md:text-2xl leading-[2.4] md:leading-[2.6]' : 'text-2xl md:text-3xl leading-tight'}`}>
              {mode === 'optimization' ? t('processingTitleFinal') : t('processingTitleInitial')}
            </h1>
            <p className={`text-muted-foreground max-w-md mx-auto ${isRTL ? 'text-sm leading-[2.6]' : 'text-sm leading-relaxed'}`}>
              {mode === 'optimization' ? t('processingDescriptionFinal') : t('processingDescriptionInitial')}
            </p>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm max-w-md mx-auto">
                {error}
              </div>
            )}
          </div>

          {/* Animated loading dots */}
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-br from-brand-blue to-brand-yellow"
                style={{
                  animation: 'pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>

          {/* Pro tip */}
          <div className="animate-fade-up-delay-3">
            <ProTip />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessingFallback() {
  return (
    <div className="h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-light flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<ProcessingFallback />}>
      <ProcessingContent />
    </Suspense>
  );
}
