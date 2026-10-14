'use client';

import { CreateDataset } from '@/components/datasets';
import { useThemeStore } from '@/store';
import { DatasetPreparationEntry } from '@/components/datasets/preparation/DatasetPreparationEntry';

export default function CreateDatasetPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return <><DatasetPreparationEntry /><CreateDataset isDark={isDark} /></>;
}
