import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface UploadStatusIconProps {
  status: 'active' | 'superseded' | 'rejected';
  className?: string;
}

export function UploadStatusIcon({ status, className = 'w-4 h-4' }: UploadStatusIconProps) {
  switch (status) {
    case 'active':
      return <CheckCircle className={`${className} text-green-500`} />;
    case 'superseded':
      return <Clock className={`${className} text-gray-400`} />;
    case 'rejected':
      return <XCircle className={`${className} text-red-500`} />;
  }
}
