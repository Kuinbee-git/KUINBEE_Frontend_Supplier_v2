import { CheckCircle, XCircle, Clock } from "lucide-react";

interface UploadStatusIconProps {
  status: "active" | "superseded" | "rejected";
  className?: string;
}

export function UploadStatusIcon({
  status,
  className = "w-4 h-4",
}: UploadStatusIconProps) {
  switch (status) {
    case "active":
      return (
        <CheckCircle
          className={`${className} text-[var(--dashboard-success-foreground)]`}
        />
      );
    case "superseded":
      return <Clock className={`${className} text-muted-foreground`} />;
    case "rejected":
      return (
        <XCircle
          className={`${className} text-[var(--dashboard-danger-foreground)]`}
        />
      );
  }
}
