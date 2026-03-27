'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, Globe, TrendingUp, MapPin, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAnalytics, AnalyticsResponse } from '@/lib/admin-api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS = ['#093D7F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];

export default function AnalyticsPage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ur';

  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await getAnalytics(12);
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthlyChartData = data?.monthly.map((m) => ({
    name: `${MONTH_NAMES[m.month - 1]} ${m.year}`,
    uploads: m.count,
  })) || [];

  const geoChartData = data?.geography.map((g) => ({
    name: g.location,
    value: g.count,
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Failed to load analytics</p>
        <p className="text-sm">{error}</p>
        <button onClick={() => fetchData()} className="mt-2 text-sm underline hover:no-underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h2 className="text-xl font-semibold text-gray-900">
          {isRTL ? 'تجزیات' : 'Analytics'}
        </h2>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{isRTL ? 'تازہ کریں' : 'Refresh'}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-sm text-gray-500">{isRTL ? 'کل ریزیومے' : 'Total Resumes'}</p>
              <p className="text-2xl font-semibold text-gray-900">{data?.total_resumes || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-sm text-gray-500">{isRTL ? 'لوکیشن ٹریک شدہ' : 'Location Tracked'}</p>
              <p className="text-2xl font-semibold text-gray-900">{data?.with_location || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Globe className="w-5 h-5 text-purple-600" />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-sm text-gray-500">{isRTL ? 'مقامات' : 'Unique Locations'}</p>
              <p className="text-2xl font-semibold text-gray-900">{data?.geography.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Uploads Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className={`flex items-center gap-2 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">
            {isRTL ? 'ماہانہ اپلوڈز' : 'Monthly Uploads'}
          </h3>
        </div>
        {monthlyChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
              />
              <Bar dataKey="uploads" fill="#093D7F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center py-16 text-gray-400">
            {isRTL ? 'ابھی تک کوئی ڈیٹا نہیں' : 'No data yet'}
          </div>
        )}
      </div>

      {/* Geography Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className={`flex items-center gap-2 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Globe className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">
              {isRTL ? 'جغرافیائی تقسیم' : 'Geography Breakdown'}
            </h3>
          </div>
          {geoChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={geoChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                >
                  {geoChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Uploads']} />
                <Legend
                  formatter={(value) => <span className="text-xs text-gray-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-16 text-gray-400">
              {isRTL ? 'لوکیشن ڈیٹا دستیاب نہیں' : 'No location data available'}
            </div>
          )}
        </div>

        {/* Location Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className={`flex items-center gap-2 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <MapPin className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">
              {isRTL ? 'اعلیٰ مقامات' : 'Top Locations'}
            </h3>
          </div>
          {data?.geography && data.geography.length > 0 ? (
            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {data.geography.map((geo, index) => (
                <div
                  key={geo.location}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{geo.location}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium text-gray-900">{geo.count}</span>
                    <span className="text-xs text-gray-400">
                      ({data.total_resumes > 0 ? ((geo.count / data.total_resumes) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-gray-400">
              {isRTL ? 'لوکیشن ڈیٹا دستیاب نہیں' : 'No location data available'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
