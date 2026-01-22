'use client';

import { SubmittedProposals } from '@/components/datasets';
import { useThemeStore } from '@/store';

export default function SubmittedProposalsPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return <SubmittedProposals isDark={isDark} />;
}
