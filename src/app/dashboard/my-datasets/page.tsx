'use client';

import { MyDatasets } from '@/components/datasets';
import { useThemeStore } from '@/store';

export default function MyDatasetsPage() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return <MyDatasets isDark={isDark} />;
}
