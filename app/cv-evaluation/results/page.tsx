'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Star, ArrowLeft, FileText, CheckCircle, Medal, AlertCircle, Download, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface ScoreBreakdown {
  hard_skills: number;
  experience: number;
  education: number;
  ats_keywords: number;
  presentation: number;
  cultural_fit: number;
}

interface RankedCandidate {
  rank: number;
  filename: string;
  candidate_name?: string;
  score: number;
  confidence?: number;
  score_breakdown?: ScoreBreakdown;
  skills_matched?: string[];
  skills_missing?: string[];
  reasoning: string;
  why_selected?: string[];
  why_not_others?: string[];
  strengths: string[];
  gaps?: string[];
  hire_recommendation?: string;
}

interface ExtractionDetail {
  filename: string;
  status: 'success' | 'failed';
  chars: number;
}

interface ExtractionReport {
  total_uploaded: number;
  successfully_extracted: number;
  failed: number;
  details: ExtractionDetail[];
}

interface EvalResult {
  evaluation_id: number;
  job_description_summary: string;
  jd_parsed?: {
    required_skills?: string[];
    preferred_skills?: string[];
    min_experience_years?: number;
    education_requirement?: string;
  };
  total_cvs: number;
  ranked_candidates: RankedCandidate[];
  extraction_report?: ExtractionReport;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    step1_tokens?: number;
    step2_tokens?: number;
  };
}

const rankColors = [
  'from-yellow-400 to-amber-500', // Gold
  'from-gray-300 to-gray-400',    // Silver
  'from-amber-600 to-amber-700',  // Bronze
];

const rankIcons = [Trophy, Medal, Star];
const rankBorders = ['border-yellow-300', 'border-gray-300', 'border-amber-400'];
const rankBg = ['bg-yellow-50', 'bg-gray-50', 'bg-amber-50'];

export default function EvalResultsPage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ur';
  const router = useRouter();
  const [results, setResults] = useState<EvalResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('evalResults');
    if (stored) {
      try {
        setResults(JSON.parse(stored));
      } catch {
        router.push('/cv-evaluation');
      }
    } else {
      router.push('/cv-evaluation');
    }
  }, [router]);

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div style={{ background: 'linear-gradient(180deg, #F0F4FA 0%, #FFFFFF 50%, #FFFFFF 100%)' }}>
        <Header />
      </div>

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-blue/10 mb-4">
              <Trophy className="w-8 h-8 text-brand-blue" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('cvEval.results.title')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('cvEval.results.subtitle')} — {results.total_cvs} {t('cvEval.results.cvsAnalyzed')}
            </p>
          </div>

          {/* Extraction Report Banner */}
          {results.extraction_report && (
            <div className={`mb-8 rounded-xl border p-4 ${
              results.extraction_report.failed === 0
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                {results.extraction_report.failed === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${results.extraction_report.failed === 0 ? 'text-green-800' : 'text-amber-800'}`}>
                    {results.extraction_report.successfully_extracted}/{results.extraction_report.total_uploaded} CVs processed successfully
                  </p>
                  {results.extraction_report.failed > 0 && (
                    <p className="text-amber-700 text-sm mt-1">
                      Could not read: {results.extraction_report.details
                        .filter(d => d.status === 'failed')
                        .map(d => d.filename)
                        .join(', ')}
                      . These CVs were excluded from ranking.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ranked Cards */}
          <div className="space-y-6 mb-12">
            {results.ranked_candidates.map((candidate, i) => {
              const RankIcon = rankIcons[i] || Star;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border-2 ${rankBorders[i] || 'border-gray-200'} ${rankBg[i] || 'bg-white'} p-6 md:p-8 transition-all duration-300 hover:shadow-lg`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Rank badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${rankColors[i] || 'from-gray-200 to-gray-300'} flex items-center justify-center shadow-lg`}>
                        <RankIcon className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-center text-sm font-bold text-foreground mt-2">
                        #{candidate.rank}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-5">
                      {/* Header: name + filename + score + badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          {candidate.candidate_name && (
                            <h3 className="text-lg font-bold text-foreground">{candidate.candidate_name}</h3>
                          )}
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-brand-blue" />
                            <span className="text-sm text-muted-foreground">{candidate.filename}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {candidate.hire_recommendation && (
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                              candidate.hire_recommendation.toLowerCase().includes('best') ? 'bg-green-100 text-green-700' :
                              candidate.hire_recommendation.toLowerCase().includes('recommended') ? 'bg-blue-100 text-blue-700' :
                              candidate.hire_recommendation.toLowerCase().includes('worth') ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {candidate.hire_recommendation}
                            </span>
                          )}
                          {candidate.confidence !== undefined && (
                            <span className="text-[10px] text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                              Confidence: {candidate.confidence}%
                            </span>
                          )}
                          <div className="text-right">
                            <span className={`text-3xl font-black ${
                              candidate.score >= 80 ? 'text-brand-green' :
                              candidate.score >= 60 ? 'text-brand-yellow' : 'text-red-500'
                            }`}>
                              {candidate.score}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      {candidate.score_breakdown && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-3">{t('cvEval.results.scoreBreakdown')}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { label: 'Hard Skills', value: candidate.score_breakdown.hard_skills, color: 'bg-brand-blue' },
                              { label: 'Experience', value: candidate.score_breakdown.experience, color: 'bg-brand-green' },
                              { label: 'Education', value: candidate.score_breakdown.education, color: 'bg-purple-500' },
                              { label: 'ATS Keywords', value: candidate.score_breakdown.ats_keywords, color: 'bg-brand-yellow' },
                              { label: 'Presentation', value: candidate.score_breakdown.presentation, color: 'bg-pink-500' },
                              { label: 'Cultural Fit', value: candidate.score_breakdown.cultural_fit, color: 'bg-cyan-500' },
                            ].map((item, k) => (
                              <div key={k} className="bg-white rounded-lg border border-gray-100 p-3">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                                  <span className="text-xs font-bold text-foreground">{item.value}</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills Matched & Missing */}
                      {(candidate.skills_matched?.length || candidate.skills_missing?.length) && (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {candidate.skills_matched && candidate.skills_matched.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">{t('cvEval.results.skillsMatched')}</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {candidate.skills_matched.map((s, j) => (
                                  <span key={j} className="px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-[11px] font-medium text-green-700">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {candidate.skills_missing && candidate.skills_missing.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">{t('cvEval.results.skillsMissing')}</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {candidate.skills_missing.map((s, j) => (
                                  <span key={j} className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[11px] font-medium text-red-600">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Why Selected */}
                      {candidate.why_selected && candidate.why_selected.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-brand-green mb-2">{t('cvEval.results.whySelected')}</h4>
                          <ul className="space-y-1.5">
                            {candidate.why_selected.map((w, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                                <span dir="ltr" className="text-left">{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Why Not Others */}
                      {candidate.why_not_others && candidate.why_not_others.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-brand-blue mb-2">{t('cvEval.results.comparedToOthers')}</h4>
                          <ul className="space-y-1.5">
                            {candidate.why_not_others.map((w, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="w-4 h-4 rounded-full bg-brand-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-[10px] font-bold text-brand-blue">vs</span>
                                </span>
                                <span dir="ltr" className="text-left">{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Reasoning */}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">
                          {t('cvEval.results.reasoning')}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed" dir="ltr">
                          {candidate.reasoning}
                        </p>
                      </div>

                      {/* Strengths */}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">
                          {t('cvEval.results.strengths')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {candidate.strengths.map((s, j) => (
                            <span key={j} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-foreground">
                              <CheckCircle className="w-3 h-3 text-brand-green flex-shrink-0" />
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Gaps */}
                      {candidate.gaps && candidate.gaps.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">{t('cvEval.results.gaps')}</h4>
                          <div className="flex flex-wrap gap-2">
                            {candidate.gaps.map((g, j) => (
                              <span key={j} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-xs font-medium text-red-700">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={async () => {
                if (!results) return;
                setDownloading(true);
                try {
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
                  const res = await fetch(`${API_URL}/v1/evaluate/report`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(results),
                  });
                  if (!res.ok) throw new Error('Failed to generate report');
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `CV_Evaluation_Report_${new Date().toISOString().split('T')[0]}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (err) {
                  alert('Failed to download report. Please try again.');
                } finally {
                  setDownloading(false);
                }
              }}
              className="gap-2 px-8 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-light text-white btn-magnetic"
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading ? (t('cvEval.results.generating') || 'Generating...') : (t('cvEval.results.downloadReport') || 'Download Report (PDF)')}
            </Button>

            <Button
              onClick={() => router.push('/cv-evaluation')}
              variant="outline"
              className="gap-2 px-8 py-3 rounded-xl border-brand-blue/30 text-brand-blue hover:bg-brand-blue/5"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('cvEval.results.backToEval')}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
