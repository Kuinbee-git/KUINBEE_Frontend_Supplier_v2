'use client';

import { HelpCircle, MessageCircle, FileText, ExternalLink, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store';
import { GlassCard } from '@/components/shared';
import { useSupplierTokens } from '@/hooks/useSupplierTokens';

const helpArticles = [
  {
    id: '1',
    title: 'Getting Started as a Supplier',
    description: 'Learn how to set up your supplier profile and start listing datasets.',
    category: 'Onboarding',
  },
  {
    id: '2',
    title: 'Dataset Upload Guidelines',
    description: 'Best practices for formatting and uploading your datasets.',
    category: 'Datasets',
  },
  {
    id: '3',
    title: 'Understanding KYC Verification',
    description: 'Learn about the verification process and required documents.',
    category: 'Verification',
  },
  {
    id: '4',
    title: 'Pricing Your Datasets',
    description: 'Guidelines for setting competitive prices for your data.',
    category: 'Monetization',
  },
];

export default function SupportPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const tokens = useSupplierTokens();

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[900px] mx-auto p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1
            className="text-3xl mb-2"
            style={{
              color: tokens.textPrimary,
              fontWeight: '600',
              lineHeight: '1.2',
            }}
          >
            Support
          </h1>
          <p className="text-sm" style={{ color: tokens.textSecondary, lineHeight: '1.5' }}>
            Get help with your supplier account and find answers to common questions.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <GlassCard className="p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)' }}
              >
                <MessageCircle className="w-6 h-6" style={{ color: '#3b82f6' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1" style={{ color: tokens.textPrimary }}>
                  Live Chat
                </h3>
                <p className="text-sm mb-3" style={{ color: tokens.textSecondary }}>
                  Chat with our support team for quick assistance.
                </p>
                <Button
                  size="sm"
                  className="text-white"
                  style={{
                    background: 'linear-gradient(135deg, #1a2240 0%, #2a3250 100%)',
                  }}
                >
                  Start Chat
                </Button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)' }}
              >
                <Mail className="w-6 h-6" style={{ color: '#10b981' }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1" style={{ color: tokens.textPrimary }}>
                  Email Support
                </h3>
                <p className="text-sm mb-3" style={{ color: tokens.textSecondary }}>
                  Send us an email for detailed inquiries.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  style={{
                    borderColor: tokens.borderDefault,
                    color: tokens.textPrimary,
                  }}
                >
                  support@kuinbee.com
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Help Articles */}
        <GlassCard className="overflow-hidden mb-8">
          <div
            className="px-6 py-4 border-b"
            style={{
              borderColor: tokens.borderDefault,
              background: isDark ? 'rgba(26, 34, 64, 0.3)' : 'rgba(248, 249, 250, 0.6)',
            }}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" style={{ color: tokens.textSecondary }} />
              <h2
                className="text-lg"
                style={{
                  color: tokens.textPrimary,
                  fontWeight: '600',
                }}
              >
                Help Articles
              </h2>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: tokens.borderDefault }}>
            {helpArticles.map((article) => (
              <button
                key={article.id}
                className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-opacity-50"
                style={{
                  background: 'transparent',
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium" style={{ color: tokens.textPrimary }}>
                      {article.title}
                    </p>
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(26, 34, 64, 0.08)',
                        color: tokens.textMuted,
                      }}
                    >
                      {article.category}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: tokens.textSecondary }}>
                    {article.description}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 shrink-0" style={{ color: tokens.textMuted }} />
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Emergency Contact */}
        <div
          className="rounded-xl border p-5"
          style={{
            background: isDark ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.03)',
            borderColor: 'rgba(245, 158, 11, 0.2)',
          }}
        >
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
            <div>
              <p className="text-sm mb-1 font-medium" style={{ color: tokens.textPrimary }}>
                Urgent Issues?
              </p>
              <p className="text-sm" style={{ color: tokens.textSecondary }}>
                For urgent account or security issues, call us at{' '}
                <span className="font-medium" style={{ color: tokens.textPrimary }}>
                  +1 (555) 123-4567
                </span>{' '}
                (Mon-Fri, 9AM-6PM IST)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
