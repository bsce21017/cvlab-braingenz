'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, FileText, Briefcase, Trophy, Loader2, X, AlertCircle, Zap, Target, BarChart3 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function CVEvaluationPage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ur';
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      addFiles(newFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validTypes = ['.pdf', '.doc', '.docx'];
    const validFiles = newFiles.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (!validTypes.includes(ext)) {
        toast.error(`${f.name}: Invalid format. Only PDF/DOCX allowed.`);
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: File too large. Max 10MB.`);
        return false;
      }
      return true;
    });

    const combined = [...files, ...validFiles];
    if (combined.length > 10) {
      toast.error(t('cvEval.maxFiles') || 'Maximum 10 CVs allowed');
      setFiles(combined.slice(0, 10));
    } else {
      setFiles(combined);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, [files]);

  const handleEvaluate = async () => {
    setError(null);

    if (files.length < 3) {
      setError(t('cvEval.minFiles') || 'Please upload at least 3 CVs');
      return;
    }
    if (!jobDescription.trim()) {
      setError(t('cvEval.needJD') || 'Please provide a job description');
      return;
    }

    setIsEvaluating(true);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('job_description', jobDescription);

      const res = await fetch(`${API_URL}/v1/evaluate`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Evaluation failed');
      }

      const result = await res.json();
      // Store results in sessionStorage and navigate to results
      sessionStorage.setItem('evalResults', JSON.stringify(result));
      router.push('/cv-evaluation/results');
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate CVs');
      toast.error(err.message || 'Evaluation failed');
    } finally {
      setIsEvaluating(false);
    }
  };

  const steps = [
    {
      iconSrc: '/assets/upload icon.png',
      title: t('cvEval.step1Title'),
      desc: t('cvEval.step1Desc'),
      color: 'from-brand-blue to-brand-blue-light',
      bg: 'bg-brand-blue',
      num: '01',
    },
    {
      iconSrc: '/assets/ai analyses brain icon.png',
      title: t('cvEval.step2Title'),
      desc: t('cvEval.step2Desc'),
      color: 'from-brand-green to-emerald-500',
      bg: 'bg-brand-green',
      num: '02',
    },
    {
      iconSrc: '/assets/dowload icon.png',
      title: t('cvEval.step3Title'),
      desc: t('cvEval.step3Desc'),
      color: 'from-brand-yellow to-amber-400',
      bg: 'bg-brand-yellow',
      num: '03',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div
        className="relative"
        style={{ background: 'linear-gradient(180deg, #F0F4FA 0%, #FFFFFF 50%, #FFFFFF 100%)' }}
      >
        <Header />

        {/* Hero Section */}
        <section className="relative py-12 lg:py-20 px-4 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left side - Text */}
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue/5 border border-brand-blue/10 text-brand-blue text-sm font-medium">
                  <Target className="w-4 h-4" />
                  {t('cvEval.badge')}
                </span>

                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight text-foreground">
                  {t('cvEval.heroTitle')}{' '}
                  <span className="text-brand-blue">{t('cvEval.heroTitleHighlight')}</span>
                </h1>

                <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                  {t('cvEval.heroSubtitle')}
                </p>

                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-brand-green" />
                    {t('cvEval.features.ats')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4 text-brand-yellow" />
                    {t('cvEval.features.ai')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BarChart3 className="w-4 h-4 text-brand-blue" />
                    {t('cvEval.features.ranking')}
                  </div>
                </div>
              </div>

              {/* Right side - Upload Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-brand-blue/5 p-6 space-y-5">
                {/* Upload CVs section */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{t('cvEval.uploadCVs')}</h3>
                      <p className="text-xs text-muted-foreground">{t('cvEval.uploadCVsDesc')}</p>
                    </div>
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                      isDragging
                        ? 'border-brand-blue bg-brand-blue/5'
                        : 'border-gray-200 hover:border-brand-blue/40 hover:bg-gray-50/50'
                    }`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-brand-blue' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium text-foreground">{t('cvEval.dropCVs')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('cvEval.supportedFormats')}</p>
                    <Button variant="outline" size="sm" className="mt-3 text-brand-blue border-brand-blue/30 hover:bg-brand-blue/5">
                      {t('cvEval.selectFiles')}
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* File list */}
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {files.length} {t('cvEval.filesSelected')}
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1.5">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-brand-blue flex-shrink-0" />
                              <span className="truncate text-foreground">{f.name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                ({(f.size / 1024).toFixed(0)}KB)
                              </span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Description */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-brand-blue" />
                    </div>
                    <h3 className="font-semibold text-foreground">{t('cvEval.jobDescription')}</h3>
                  </div>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder={t('cvEval.jobDescPlaceholder')}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue/40 placeholder:text-gray-400 text-sm resize-none"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Evaluate Button */}
                <Button
                  onClick={handleEvaluate}
                  disabled={isEvaluating || files.length < 3 || !jobDescription.trim()}
                  className="w-full h-12 bg-brand-blue hover:bg-brand-blue-light text-white font-semibold rounded-xl btn-magnetic transition-all duration-300 disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t('cvEval.evaluating')}
                    </>
                  ) : (
                    <>
                      <Trophy className="w-5 h-5 mr-2" />
                      {t('cvEval.evaluateBtn')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* How it works — same design as CV Optimization page */}
      <section className="py-28 lg:py-36 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(9,61,127,0.03),transparent_50%)]" />

        <div className="max-w-6xl mx-auto relative">
          <div className={`max-w-xl mb-20 animate-fade-up ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {!isRTL && (
              <span className="inline-block text-xs font-bold text-brand-blue tracking-[0.2em] uppercase mb-4">
                {t('cvEval.howItWorks')}
              </span>
            )}
            <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
              {t('cvEval.howItWorksSubtitle')}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('cvEval.heroSubtitle')}
            </p>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`animate-fade-up-delay-${index + 1}`}
                  style={{ marginTop: index === 1 ? '2rem' : index === 2 ? '4rem' : '0' }}
                >
                  {/* Step number */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className={`text-[4rem] font-black bg-gradient-to-br ${step.color} bg-clip-text text-transparent leading-none`}>
                      {step.num}
                    </span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  {/* Card */}
                  <div className="group relative">
                    <div className="absolute -inset-px bg-gradient-to-br from-gray-200 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-white border border-gray-100 rounded-2xl p-7 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-brand-blue/5 group-hover:-translate-y-1">
                      {/* Icon */}
                      <div className={`w-14 h-14 ${step.bg} rounded-2xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                        <Image src={step.iconSrc} alt={step.title} width={28} height={28} className="w-7 h-7" />
                      </div>

                      <h3 className="text-xl font-bold text-foreground mb-3 leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
