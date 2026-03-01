'use client';

import { useState, useEffect } from 'react';
import { Award, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/shared';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';
import { getDatasetKdts, type DatasetKdtsResponse } from '@/lib/api/kdts';

interface KdtsScoreCardProps {
  datasetId: string;
  /** 'glass' (default) uses GlassCard with backdrop blur; 'flat' uses a plain bordered card matching DatasetDetail */
  variant?: 'glass' | 'flat';
}

const KDTS_DIMS: Array<{ key: keyof NonNullable<DatasetKdtsResponse['breakdown']>; label: string }> = [
  { key: 'Q', label: 'Completeness' },
  { key: 'L', label: 'Legitimacy' },
  { key: 'P', label: 'Precision' },
  { key: 'U', label: 'Usefulness' },
  { key: 'F', label: 'Freshness' },
];

export function KdtsScoreCard({ datasetId, variant = 'glass' }: KdtsScoreCardProps) {
  const tokens = useSupplierTokens();
  const [data, setData] = useState<DatasetKdtsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDatasetKdts(datasetId)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { /* silently ignore */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [datasetId]);

  const inner = (
    <>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-5">
        <Award className="w-5 h-5" style={{ color: tokens.textSecondary }} />
        <h3 className="text-base font-semibold" style={{ color: tokens.textPrimary }}>
          KDTS Score
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: tokens.textMuted }} />
          <span className="text-sm" style={{ color: tokens.textMuted }}>Loading…</span>
        </div>
      ) : !data?.currentScore ? (
        <p className="text-sm text-center py-2" style={{ color: tokens.textMuted }}>
          Not yet scored by Kuinbee
        </p>
      ) : (
        <>
          {/* Overall score */}
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-bold" style={{ color: '#3b82f6' }}>
              {parseFloat(data.currentScore).toFixed(1)}
            </span>
            <span className="text-sm" style={{ color: tokens.textMuted }}>/&nbsp;100</span>
          </div>

          {/* Dimension grid */}
          <div className="grid grid-cols-2 gap-2">
            {KDTS_DIMS.map(({ key, label }) => (
              <div
                key={key}
                className="rounded-lg p-2.5"
                style={{
                  background: tokens.glassBg,
                  border: `1px solid ${tokens.borderSubtle}`,
                }}
              >
                <p className="text-xs mb-1" style={{ color: tokens.textMuted }}>
                  {key} — {label}
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: tokens.borderSubtle }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${data.breakdown?.[key] ?? 0}%`,
                        background: '#3b82f6',
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-semibold tabular-nums w-7 text-right"
                    style={{ color: tokens.textPrimary }}
                  >
                    {data.breakdown?.[key] ?? 0}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {data.updatedAt && (
            <p className="mt-3 text-xs" style={{ color: tokens.textMuted }}>
              Last assessed {new Date(data.updatedAt).toLocaleDateString()}
            </p>
          )}
        </>
      )}
    </>
  );

  if (variant === 'flat') {
    return (
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: tokens.isDark ? 'rgba(26, 34, 64, 0.4)' : '#ffffff',
          borderColor: tokens.borderDefault,
          boxShadow: tokens.isDark
            ? '0 2px 8px rgba(0, 0, 0, 0.18)'
            : '0 2px 8px rgba(26, 34, 64, 0.06)',
        }}
      >
        <div className="px-6 py-5">{inner}</div>
      </div>
    );
  }

  return <GlassCard className="p-4">{inner}</GlassCard>;
}
