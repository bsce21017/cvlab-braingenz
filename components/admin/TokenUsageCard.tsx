'use client';

import React, { useState, useEffect } from 'react';
import { Zap, FileText, Trophy, TrendingUp, Loader2 } from 'lucide-react';
import { getTokenUsage, TokenUsageResponse } from '@/lib/admin-api';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TokenUsageCard() {
  const { t } = useLanguage();
  const [data, setData] = useState<TokenUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getTokenUsage();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load token usage');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm text-red-500">{error || 'No data'}</p>
      </div>
    );
  }

  const optimizationTokens = data.by_feature?.cv_optimization?.total_tokens || 0;
  const evaluationTokens = data.by_feature?.cv_evaluation?.total_tokens || 0;
  const evaluationRequests = data.by_feature?.cv_evaluation?.requests || 0;
  const evaluationCVs = data.by_feature?.cv_evaluation?.total_cvs || 0;

  const stats = [
    {
      icon: Zap,
      label: t('admin.tokenUsage.totalTokens') || 'Total Tokens Used',
      value: data.grand_total_tokens.toLocaleString(),
      color: 'text-brand-blue',
      bg: 'bg-brand-blue/10',
    },
    {
      icon: FileText,
      label: t('admin.tokenUsage.cvOptimization') || 'CV Optimization',
      value: optimizationTokens.toLocaleString(),
      sub: `${data.by_feature?.cv_optimization?.requests || 0} requests`,
      color: 'text-brand-green',
      bg: 'bg-green-50',
    },
    {
      icon: Trophy,
      label: t('admin.tokenUsage.cvEvaluation') || 'CV Evaluation',
      value: evaluationTokens.toLocaleString(),
      sub: `${evaluationRequests} evaluations · ${evaluationCVs} CVs`,
      color: 'text-brand-yellow',
      bg: 'bg-yellow-50',
    },
    {
      icon: TrendingUp,
      label: t('admin.tokenUsage.totalRequests') || 'Total AI Requests',
      value: data.total_requests.toLocaleString(),
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-brand-blue" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {t('admin.tokenUsage.title') || 'Token Usage'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('admin.tokenUsage.subtitle') || 'AI token consumption across features'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className="text-center p-4 rounded-xl bg-gray-50/50 border border-gray-100">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg} mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            {stat.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Recent usage */}
      {data.recent_usage.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            {t('admin.tokenUsage.recentActivity') || 'Recent Activity'}
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.recent_usage.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  {item.feature === 'cv_evaluation' ? (
                    <Trophy className="w-3.5 h-3.5 text-brand-yellow" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-brand-green" />
                  )}
                  <span className="font-medium text-foreground capitalize">
                    {item.feature.replace('_', ' ')}
                  </span>
                  {item.num_cvs > 1 && (
                    <span className="text-muted-foreground">({item.num_cvs} CVs)</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{item.model}</span>
                  <span className="font-semibold text-foreground">{item.total_tokens.toLocaleString()} tokens</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
