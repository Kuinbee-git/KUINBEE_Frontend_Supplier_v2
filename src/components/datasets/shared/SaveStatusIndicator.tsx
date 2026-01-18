import { Save } from 'lucide-react';

interface SaveStatusIndicatorProps {
  status: 'saved' | 'saving' | 'idle';
  isDark?: boolean;
}

export function SaveStatusIndicator({ status, isDark = false }: SaveStatusIndicatorProps) {
  const textColor = isDark ? 'rgba(255, 255, 255, 0.5)' : '#7a8494';

  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: textColor }}>
      <Save className={`w-4 h-4 ${status === 'saving' ? 'animate-spin' : ''}`} />
      <span>{status === 'saving' ? 'Saving...' : 'Saved'}</span>
    </div>
  );
}
