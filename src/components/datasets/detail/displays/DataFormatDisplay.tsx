"use client";

import { Label } from "@/components/ui/label";
import type { DatasetDetailTokens } from "../detailTokens";

interface DataFormatDisplayValue {
  fileFormat: string;
  rows: number | null;
  cols: number | null;
  fileSize: string | null;
  compressionType?: string | null;
  encoding?: string | null;
  updatedAt?: string;
}

interface DataFormatDisplayProps {
  dataFormat: DataFormatDisplayValue;
  tokens: DatasetDetailTokens;
  formatDate: (date: string) => string;
}

export function DataFormatDisplay({
  dataFormat,
  tokens,
  formatDate,
}: DataFormatDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label style={{ color: tokens.textSecondary }}>File Format</Label>
        <p
          className="text-sm font-medium"
          style={{ color: tokens.textPrimary }}
        >
          {dataFormat.fileFormat}
        </p>
      </div>
      <div>
        <Label style={{ color: tokens.textSecondary }}>File Size</Label>
        <p className="text-sm" style={{ color: tokens.textPrimary }}>
          {dataFormat.fileSize || "N/A"}
        </p>
      </div>
      <div>
        <Label style={{ color: tokens.textSecondary }}>Rows</Label>
        <p className="text-sm" style={{ color: tokens.textPrimary }}>
          {dataFormat.rows?.toLocaleString() ?? "N/A"}
        </p>
      </div>
      <div>
        <Label style={{ color: tokens.textSecondary }}>Columns</Label>
        <p className="text-sm" style={{ color: tokens.textPrimary }}>
          {dataFormat.cols?.toLocaleString() ?? "N/A"}
        </p>
      </div>
      {dataFormat.compressionType && (
        <div>
          <Label style={{ color: tokens.textSecondary }}>Compression</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {dataFormat.compressionType}
          </p>
        </div>
      )}
      {dataFormat.encoding && (
        <div>
          <Label style={{ color: tokens.textSecondary }}>Encoding</Label>
          <p className="text-sm" style={{ color: tokens.textPrimary }}>
            {dataFormat.encoding}
          </p>
        </div>
      )}
      {dataFormat.updatedAt && (
        <div
          className="col-span-2 pt-3 border-t"
          style={{ borderColor: tokens.borderSubtle }}
        >
          <p className="text-xs" style={{ color: tokens.textMuted }}>
            Last updated: {formatDate(dataFormat.updatedAt)}
          </p>
        </div>
      )}
    </div>
  );
}
