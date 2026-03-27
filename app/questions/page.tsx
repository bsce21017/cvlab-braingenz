'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/questions/LanguageSwitcher';
import FileDisplay from '@/components/questions/FileDisplay';
import QuestionCard from '@/components/questions/QuestionCard';

import { getQuestions, submitAnswers, QuestionItem, AnswerItem } from '@/lib/api';

export default function QuestionsPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const isRTL = language === 'ur';

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('Resume.pdf');
  const [fileSize, setFileSize] = useState('0 kB');

  useEffect(() => {
    const resumeId = sessionStorage.getItem('resumeId');
    const storedFilename = sessionStorage.getItem('resumeFilename');
    const storedFileSize = sessionStorage.getItem('resumeFileSize');

    if (storedFilename) setFileName(storedFilename);
    if (storedFileSize) {
      const sizeKB = Math.round(parseInt(storedFileSize) / 1024);
      setFileSize(`${sizeKB} kB`);
    }

    if (!resumeId) { router.push('/'); return; }

    const fetchQuestions = async () => {
      try {
        const response = await getQuestions(parseInt(resumeId));
        setQuestions(response.questions);
        const initialAnswers: Record<number, string> = {};
        response.questions.forEach((q) => { initialAnswers[q.id] = ''; });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally { setLoading(false); }
    };

    fetchQuestions();
  }, [router]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const calculateProgress = () => {
    if (questions.length === 0) return 0;
    const filledCount = Object.values(answers).filter((a) => a.trim() !== '').length;
    return Math.round((filledCount / questions.length) * 100);
  };

  const handleAnalyze = async () => {
    const resumeId = sessionStorage.getItem('resumeId');
    if (!resumeId) { router.push('/'); return; }

    setSubmitting(true);
    setError(null);

    try {
      const answerItems: AnswerItem[] = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || '',
        status: answers[q.id]?.trim() ? 'complete' : 'skipped',
      }));

      await submitAnswers({ resume_id: parseInt(resumeId), answers: answerItems });
      router.push('/processing?mode=optimization');
    } catch (err) {
      console.error('Error submitting answers:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit answers');
      setSubmitting(false);
    }
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-blue-light flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-muted-foreground text-sm">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand-blue-muted/10 to-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Simple header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-brand-blue/[0.06] bg-white/80 backdrop-blur-md sticky top-0 z-40" dir={isRTL ? 'rtl' : 'ltr'}>
        <Link href="/" className="flex items-center" dir="ltr">
          <Image src="/assets/Main logo.svg" alt="CV Summit Logo" width={160} height={80} className="h-12 w-auto" />
        </Link>
        <LanguageSwitcher />
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="mb-8 animate-fade-up">
          <div className={`flex items-center gap-4 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center shadow-sm">
              <MessageSquare className="w-6 h-6 text-brand-yellow" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('questions')}</h1>
              <p className="text-xs text-muted-foreground">{questions.length} questions to answer</p>
            </div>
          </div>
        </div>

        {/* File info */}
        <div className="animate-fade-up-delay-1">
          <FileDisplay
            fileName={fileName}
            fileSize={fileSize}
            pageCount={1}
            status={t('ready')}
            isRTL={isRTL}
          />
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8 animate-fade-up-delay-2">
          {/* Card header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-foreground mb-2">{t('resumeOptimizationTitle')}</h2>
            <p className="text-muted-foreground text-sm max-w-2xl">{t('resumeOptimizationSubtitle')}</p>

            {/* Progress bar */}
            <div className="mt-6">
              <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-xs text-muted-foreground font-medium">{t('progress')}</span>
                <span className="text-xs font-bold text-brand-blue">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-brand-blue/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #093D7F, #F9CB12)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="px-8 py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-8">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  number={index + 1}
                  title={question.question}
                  placeholder={question.example || 'Type your answer here...'}
                  value={answers[question.id] || ''}
                  onChange={(value) => handleAnswerChange(question.id, value)}
                  isRTL={isRTL}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-center pb-12">
          <button
            onClick={handleAnalyze}
            disabled={submitting}
            className="btn-magnetic flex items-center gap-3 bg-brand-blue text-white px-10 py-4 rounded-xl font-bold text-sm hover:bg-brand-blue-light transition-all duration-300 shadow-lg shadow-brand-blue/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Image src="/assets/analyze_optimize.svg" alt="Analyze" width={20} height={20} className="w-5 h-5" />
            )}
            <span>{submitting ? 'Submitting...' : t('analyzeButton')}</span>
            {!submitting && (isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />)}
          </button>
        </div>
      </div>
    </div>
  );
}
