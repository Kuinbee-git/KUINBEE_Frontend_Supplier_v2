'use client';

import { useParams } from 'next/navigation';
import { MyDatasetDetail } from '@/components/datasets';
import { useThemeStore } from '@/store';

export default function MyDatasetDetailPage() {
  const { theme } = useThemeStore();
  const params = useParams();
  const isDark = theme === 'dark';
  const datasetId = params.id as string;

  return <MyDatasetDetail datasetId={datasetId} isDark={isDark} />;
}
