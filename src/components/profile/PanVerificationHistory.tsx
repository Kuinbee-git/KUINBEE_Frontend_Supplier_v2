'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Shield, AlertCircle, ChevronRight } from 'lucide-react';
import { getPanAttempts } from '@/lib/api/supplier';
import type { PanAttemptListItem } from '@/types/onboarding.types';

interface PanVerificationHistoryProps {
  isDark?: boolean;
}

export function PanVerificationHistory({ isDark = false }: PanVerificationHistoryProps) {
  const [attempts, setAttempts] = useState<PanAttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const pageSize = 10;

  const tokens = {
    textPrimary: isDark ? '#ffffff' : '#1a2240',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    surface: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
    borderDefault: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    borderSubtle: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
  };

  useEffect(() => {
    fetchAttempts();
  }, [page]);

  const fetchAttempts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPanAttempts({ page, pageSize });
      setAttempts(response.items);
      setTotalAttempts(response.total);
    } catch (err: any) {
      console.error('Failed to fetch PAN attempts:', err);
      setError(err.message || 'Failed to load verification history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return {
          bg: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)',
          border: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
          text: '#22c55e',
        };
      case 'FAILED':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
          border: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
          text: '#ef4444',
        };
      case 'PENDING':
        return {
          bg: isDark ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.05)',
          border: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.2)',
          text: '#eab308',
        };
      default:
        return {
          bg: isDark ? 'rgba(156, 163, 175, 0.1)' : 'rgba(156, 163, 175, 0.05)',
          border: isDark ? 'rgba(156, 163, 175, 0.3)' : 'rgba(156, 163, 175, 0.2)',
          text: '#9ca3af',
        };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(totalAttempts / pageSize);

  return (
    <Card
      className="border overflow-hidden"
      style={{
        background: tokens.surface,
        borderColor: tokens.borderDefault,
      }}
    >
      <div className="p-6 border-b" style={{ borderColor: tokens.borderSubtle }}>
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6" style={{ color: tokens.textSecondary }} />
          <div>
            <h3 className="text-lg font-semibold" style={{ color: tokens.textPrimary }}>
              PAN Verification History
            </h3>
            <p className="text-sm" style={{ color: tokens.textMuted }}>
              {totalAttempts} {totalAttempts === 1 ? 'attempt' : 'attempts'} recorded
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-lg animate-pulse"
                style={{ background: tokens.borderSubtle }}
              />
            ))}
          </div>
        ) : error ? (
          <div
            className="p-4 rounded-lg border text-center"
            style={{
              background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <XCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#ef4444' }} />
            <p className="text-sm" style={{ color: '#ef4444' }}>
              {error}
            </p>
            <Button
              onClick={fetchAttempts}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: tokens.textMuted }} />
            <p className="text-sm" style={{ color: tokens.textMuted }}>
              No verification attempts yet
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {attempts.map((attempt) => {
                const statusColors = getStatusColor(attempt.status);
                return (
                  <div
                    key={attempt.id}
                    className="p-4 rounded-lg border"
                    style={{
                      background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(26, 34, 64, 0.02)',
                      borderColor: tokens.borderSubtle,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(attempt.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-sm font-medium px-2 py-0.5 rounded-full"
                              style={{
                                background: statusColors.bg,
                                color: statusColors.text,
                                border: `1px solid ${statusColors.border}`,
                              }}
                            >
                              {attempt.status}
                            </span>
                            <span className="text-xs font-mono" style={{ color: tokens.textMuted }}>
                              {attempt.id.slice(0, 8)}
                            </span>
                          </div>
                          <p className="text-xs mb-1" style={{ color: tokens.textSecondary }}>
                            Provider: {attempt.provider}
                          </p>
                          <p className="text-xs" style={{ color: tokens.textMuted }}>
                            {formatDate(attempt.createdAt)}
                          </p>
                          {attempt.errorCode && (
                            <p className="text-xs mt-2 font-mono" style={{ color: '#ef4444' }}>
                              Error: {attempt.errorCode}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: tokens.textMuted }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: tokens.borderSubtle }}>
                <p className="text-sm" style={{ color: tokens.textMuted }}>
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
