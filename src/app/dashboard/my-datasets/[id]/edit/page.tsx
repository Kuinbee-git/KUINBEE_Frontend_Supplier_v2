'use client';

import { useParams } from 'next/navigation';
import { DelistedDatasetEdit } from '@/components/datasets';

export default function DelistedDatasetEditPage() {
  const params = useParams();
  const datasetId = params.id as string;

  return <DelistedDatasetEdit datasetId={datasetId} />;
}
