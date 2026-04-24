'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface SocialComparison {
  category: string;
  color: string;
  userMonthly: number;
  benchmark: number;
  currency: string;
  diffPct: number;
}

interface ApiResponse {
  optIn: boolean;
  comparisons?: SocialComparison[];
}

export function SocialComparisonWidget() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabling, setEnabling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/insights/social-comparison');
      if (!response.ok) throw new Error('Failed to fetch comparison data');
      const json: ApiResponse = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEnableComparison = useCallback(async () => {
    try {
      setEnabling(true);
      const response = await fetch('/api/household', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialComparison: true }),
      });
      if (!response.ok) throw new Error('Failed to enable comparison');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setEnabling(false);
    }
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
              <div className="h-5 w-16 bg-slate-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-200 rounded" />
              <div className="h-2 w-32 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-red-200">
        <p className="text-sm text-red-700">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  if (!data.optIn) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-emerald-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-emerald-50 rounded-xl flex-shrink-0">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Compare Your Spending
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Compare your spending with people like you — anonymized averages
              from similar households.
            </p>
            <button
              onClick={handleEnableComparison}
              disabled={enabling}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {enabling ? 'Enabling...' : 'Enable comparison'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const comparisons = data.comparisons || [];

  if (comparisons.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-slate-200">
        <p className="text-sm text-slate-600">
          Not enough data yet — upload more transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comparisons.map((comp) => {
        const isMore = comp.diffPct > 0;
        const isLess = comp.diffPct < 0;
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: comp.currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });

        const userStr = formatter.format(comp.userMonthly);
        const benchmarkStr = formatter.format(comp.benchmark);

        const max = Math.max(comp.userMonthly, comp.benchmark);
        const userPct = max > 0 ? (comp.userMonthly / max) * 100 : 0;
        const benchmarkPct = max > 0 ? (comp.benchmark / max) * 100 : 0;

        return (
          <div key={comp.category} className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: comp.color }}
                />
                <span className="text-sm font-medium text-slate-900">
                  {comp.category}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {userStr} vs {benchmarkStr}
                </div>
                <div
                  className={`text-xs font-medium mt-1 px-2 py-1 rounded inline-block ${
                    isMore
                      ? 'bg-red-50 text-red-700'
                      : isLess
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isMore
                    ? `+${comp.diffPct}% more than average`
                    : isLess
                      ? `${Math.abs(comp.diffPct)}% below average`
                      : 'On par'}
                </div>
              </div>
            </div>

            <div className="flex gap-2 items-center h-2">
              <div className="flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-slate-400"
                    style={{ width: `${userPct}%` }}
                  />
                  <div
                    className="bg-emerald-400"
                    style={{ width: `${benchmarkPct - userPct}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span>You</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Average</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
