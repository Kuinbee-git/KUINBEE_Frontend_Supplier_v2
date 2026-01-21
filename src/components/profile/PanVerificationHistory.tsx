'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Shield, AlertCircle, ChevronRight } from 'lucide-react';
import { getPanAttempts } from '@/lib/api/supplier';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';
import type { PanAttemptListItem } from '@/types/onboarding.types';

interface PanVerificationHistoryProps {
  isDark?: boolean;
}

export function PanVerificationHistory({ isDark }: PanVerificationHistoryProps) {
  const [attempts, setAttempts] = useState<PanAttemptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalAttempts, setTotalAttempts] = useState(0);
  
  const tokens = useSupplierTokens();
  const pageSize = 10;

  const colorTokens = {
    textPrimary: tokens.textPrimary,
    textSecondary: tokens.textSecondary,
    textMuted: tokens.textMuted,
  };

  useEffect(() => {
    fetchAttempts();
  }, [page]);

  const fetchAttempts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPanAttempts({ page, pageSize });
      setAttempts(response.items || []);
      setTotalAttempts(response.total || 0);
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
          bg: 'rgba(34, 197, 94, 0.1)',
          border: 'rgba(34, 197, 94, 0.3)',
          text: '#22c55e',
        };
      case 'FAILED':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
          text: '#ef4444',
        };
      case 'PENDING':
        return {
          bg: 'rgba(234, 179, 8, 0.1)',
          border: 'rgba(234, 179, 8, 0.3)',
          text: '#eab308',
        };
      default:
        return {
          bg: 'rgba(156, 163, 175, 0.1)',
          border: 'rgba(156, 163, 175, 0.3)',
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
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: tokens.glassBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderColor: tokens.glassBorder,
        boxShadow: tokens.isDark ? undefined : tokens.glassShadow,
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: tokens.borderDefault }}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5" style={{ color: tokens.textSecondary }} />
          <div>
            <h3
              className="text-base"
              style={{ color: tokens.textPrimary, fontWeight: '600' }}
            >
              PAN Verification History
            </h3>
            <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>
              {totalAttempts} {totalAttempts === 1 ? 'attempt' : 'attempts'} recorded
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-hidden" style={{ scrollbarWidth: 'none' }}>
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
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
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
            <Shield className="w-12 h-12 mx-auto mb-3" style={{ color: colorTokens.textMuted }} />
            <p className="text-sm" style={{ color: colorTokens.textMuted }}>
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
                    className="p-4 rounded-lg border transition-all duration-200 hover:shadow-sm"
                    style={{
                      background: tokens.inputBg,
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
                            <span className="text-xs font-mono" style={{ color: colorTokens.textMuted }}>
                              {attempt.id.slice(0, 8)}
                            </span>
                          </div>
                          <p className="text-xs mb-1" style={{ color: colorTokens.textSecondary }}>
                            Provider: {attempt.provider}
                          </p>
                          <p className="text-xs" style={{ color: colorTokens.textMuted }}>
                            {formatDate(attempt.createdAt)}
                          </p>
                          {attempt.errorCode && (
                            <p className="text-xs mt-2 font-mono" style={{ color: '#ef4444' }}>
                              Error: {attempt.errorCode}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: colorTokens.textMuted }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: tokens.borderSubtle }}>
                <p className="text-sm" style={{ color: colorTokens.textMuted }}>
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
    </div>
  );
}
