'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Star, ArrowLeft, FileText, CheckCircle, Medal, AlertCircle } from 'lucide-react';
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
  score: number;
  score_breakdown?: ScoreBreakdown;
  reasoning: string;
  strengths: string[];
  gaps?: string[];
  hire_recommendation?: string;
}

interface EvalResult {
  evaluation_id: number;
  job_description_summary: string;
  total_cvs: number;
  ranked_candidates: RankedCandidate[];
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
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
              {t('cvEval.results.subtitle')} — {results.total_cvs} CVs analyzed
            </p>
          </div>

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
                      {/* Header: filename + score + recommendation */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-brand-blue" />
                            <span className="text-sm text-muted-foreground">{t('cvEval.results.filename')}</span>
                          </div>
                          <h3 className="text-lg font-bold text-foreground">{candidate.filename}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          {candidate.hire_recommendation && (
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              candidate.hire_recommendation.toLowerCase().includes('strong') ? 'bg-green-100 text-green-700' :
                              candidate.hire_recommendation.toLowerCase().includes('no') ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {candidate.hire_recommendation}
                            </span>
                          )}
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground block">{t('cvEval.results.score')}</span>
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
                          <h4 className="text-sm font-semibold text-foreground mb-3">Score Breakdown</h4>
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

                      {/* Reasoning */}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">
                          {t('cvEval.results.reasoning')}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
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
                          <h4 className="text-sm font-semibold text-foreground mb-2">Gaps & Concerns</h4>
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

          {/* Token usage info */}
          {results.token_usage && (
            <div className="bg-gray-50 rounded-xl p-4 mb-8 text-center">
              <p className="text-xs text-muted-foreground">
                Tokens used: {results.token_usage.total_tokens.toLocaleString()} (Input: {results.token_usage.input_tokens.toLocaleString()} | Output: {results.token_usage.output_tokens.toLocaleString()})
              </p>
            </div>
          )}

          {/* Back button */}
          <div className="text-center">
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
