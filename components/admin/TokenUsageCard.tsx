'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, FileText, Trophy, TrendingUp, Loader2, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { getTokenUsage, getTokenHistory, deleteTokenRecord, deleteAllTokenHistory, TokenUsageResponse, TokenHistoryResponse, GroupedTokenRecord } from '@/lib/admin-api';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

export default function TokenUsageCard() {
  const { t } = useLanguage();
  const [data, setData] = useState<TokenUsageResponse | null>(null);
  const [history, setHistory] = useState<TokenHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [featureFilter, setFeatureFilter] = useState<string>('all');
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const result = await getTokenUsage();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const result = await getTokenHistory(currentPage, 15, featureFilter);
      setHistory(result);
    } catch (err) {
      console.error('Failed to load token history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [currentPage, featureFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDeleteGroup = async (ids: number[]) => {
    if (!confirm('Delete this request record?')) return;
    setDeleting(ids[0]);
    try {
      for (const id of ids) {
        await deleteTokenRecord(id);
      }
      await fetchHistory();
      await fetchStats();
    } catch (err) {
      alert('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    setShowDeleteAll(false);
    try {
      await deleteAllTokenHistory(featureFilter !== 'all' ? featureFilter : undefined);
      await fetchHistory();
      await fetchStats();
    } catch (err) {
      alert('Failed to delete history');
    }
  };

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
    { icon: Zap, label: t('admin.tokenUsage.totalTokens') || 'Total Tokens Used', value: data.grand_total_tokens.toLocaleString(), color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { icon: FileText, label: t('admin.tokenUsage.cvOptimization') || 'CV Optimization', value: optimizationTokens.toLocaleString(), sub: `${data.by_feature?.cv_optimization?.requests || 0} requests`, color: 'text-brand-green', bg: 'bg-green-50' },
    { icon: Trophy, label: t('admin.tokenUsage.cvEvaluation') || 'CV Evaluation', value: evaluationTokens.toLocaleString(), sub: `${evaluationRequests} evaluations · ${evaluationCVs} CVs`, color: 'text-brand-yellow', bg: 'bg-yellow-50' },
    { icon: TrendingUp, label: t('admin.tokenUsage.totalRequests') || 'Total AI Requests', value: data.total_requests.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const getFeatureLabel = (feature: string) => {
    return feature === 'cv_evaluation' ? 'CV Evaluation' : 'CV Optimization';
  };

  const getFeatureIcon = (feature: string) => {
    return feature === 'cv_evaluation' ? Trophy : FileText;
  };

  const getFeatureColor = (feature: string) => {
    return feature === 'cv_evaluation' ? 'text-brand-yellow' : 'text-brand-green';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-brand-blue" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{t('admin.tokenUsage.title') || 'Token Usage'}</h3>
          <p className="text-xs text-muted-foreground">{t('admin.tokenUsage.subtitle') || 'AI token consumption across features'}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* History Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground">
            {t('admin.tokenUsage.history') || 'Token History'}
            {history && <span className="text-muted-foreground font-normal ml-2">({history.total} requests)</span>}
          </h4>
          <div className="flex items-center gap-3">
            <select
              value={featureFilter}
              onChange={(e) => { setFeatureFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="all">All Features</option>
              <option value="cv_optimization">CV Optimization</option>
              <option value="cv_evaluation">CV Evaluation</option>
            </select>
            {history && history.total > 0 && (
              <button
                onClick={() => setShowDeleteAll(true)}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Delete All Confirmation */}
        {showDeleteAll && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-700">Delete {featureFilter !== 'all' ? featureFilter.replace('_', ' ') : 'all'} token history?</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowDeleteAll(false)} className="text-xs px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteAll} className="text-xs px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        )}

        {/* Grouped History Table */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase px-4 py-3 w-8"></th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase px-4 py-3">Request</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase px-4 py-3">Model</th>
                <th className="text-right text-[11px] font-semibold text-gray-500 uppercase px-4 py-3">Total Tokens</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase px-4 py-3">CVs</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase px-4 py-3">Steps</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase px-4 py-3">Date</th>
                <th className="text-center text-[11px] font-semibold text-gray-500 uppercase px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {historyLoading ? (
                <tr><td colSpan={8} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" /></td></tr>
              ) : history && history.items.length > 0 ? (
                history.items.map((group, idx) => {
                  const FeatureIcon = getFeatureIcon(group.feature);
                  const isExpanded = expandedRow === idx;
                  return (
                    <React.Fragment key={idx}>
                      {/* Main row */}
                      <tr
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedRow(isExpanded ? null : idx)}
                      >
                        <td className="px-4 py-3">
                          {group.step_count > 1 ? (
                            isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : <span className="w-4 h-4 block" />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FeatureIcon className={`w-4 h-4 ${getFeatureColor(group.feature)}`} />
                            <span className="text-xs font-medium text-foreground">{getFeatureLabel(group.feature)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{group.model || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-foreground">{group.total_tokens.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{group.num_cvs > 1 ? `${group.num_cvs} CVs` : '1 CV'}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            {group.step_count} {group.step_count === 1 ? 'call' : 'calls'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {group.created_at ? formatDistanceToNow(new Date(group.created_at), { addSuffix: true }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDeleteGroup(group.ids)}
                            disabled={deleting === group.ids[0]}
                            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            {deleting === group.ids[0] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded step details */}
                      {isExpanded && group.step_count > 1 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-0">
                            <div className="bg-gray-50 rounded-lg p-4 my-2 ml-8">
                              <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2">Step Breakdown</p>
                              <div className="space-y-1.5">
                                {group.steps.map((step, si) => (
                                  <div key={si} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-brand-blue/10 flex items-center justify-center text-[10px] font-bold text-brand-blue">
                                        {si + 1}
                                      </span>
                                      <span className="font-medium text-foreground capitalize">{(step.prompt_name || 'unknown').replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-muted-foreground">
                                      <span>In: {step.input_tokens.toLocaleString()}</span>
                                      <span>Out: {step.output_tokens.toLocaleString()}</span>
                                      <span className="font-semibold text-foreground">{step.total_tokens.toLocaleString()} tokens</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr><td colSpan={8} className="text-center py-8 text-sm text-muted-foreground">No token history found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {history && history.total_pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground">
              Page {history.page} of {history.total_pages} ({history.total} requests)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || historyLoading}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, history.total_pages) }, (_, i) => {
                let page: number;
                if (history.total_pages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= history.total_pages - 2) page = history.total_pages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    disabled={historyLoading}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      page === currentPage ? 'bg-brand-blue text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(history.total_pages, p + 1))}
                disabled={currentPage === history.total_pages || historyLoading}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
