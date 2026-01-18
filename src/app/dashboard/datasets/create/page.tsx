'use client';

import { CreateDataset } from '@/components/datasets';
import { useThemeStore } from '@/store';

export default function CreateDatasetPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return <CreateDataset isDark={isDark} />;
}
