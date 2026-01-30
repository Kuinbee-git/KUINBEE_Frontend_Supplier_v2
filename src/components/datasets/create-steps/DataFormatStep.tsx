'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StyledSelect } from '@/components/datasets/shared/StyledSelect';
import type { FileFormat, CompressionType } from '@/types/dataset-proposal.types';

const FILE_FORMATS: FileFormat[] = ["CSV", "JSON", "EXCEL", "PARQUET", "SQL", "XML", "TSV", "AVRO", "HDF5", "PICKLE", "FEATHER", "OTHER"];
const COMPRESSION_TYPES: CompressionType[] = ["NONE", "ZIP", "GZIP", "BZIP2", "TAR", "RAR"];

interface DataFormatStepProps {
  data: {
    fileFormat: FileFormat | '';
    fileSize: string;
    rows: number;
    cols: number;
    compressionType?: CompressionType;
    encoding?: string;
  };
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
  tokens: any;
  isDark?: boolean;
}

export function DataFormatStep({ data, onChange, disabled, tokens, isDark = false }: DataFormatStepProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="fileFormat" style={{ color: tokens.textPrimary }}>
          File Format <span className="text-red-500">*</span>
        </Label>
        <StyledSelect
          options={[...FILE_FORMATS].map(format => ({ label: format, value: format }))}
          value={data.fileFormat}
          onValueChange={(value) => onChange('fileFormat', value)}
          placeholder="Select file format"
          disabled={disabled}
          tokens={tokens}
          isDark={isDark}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fileSize" style={{ color: tokens.textPrimary }}>
          File Size <span className="text-red-500">*</span>
        </Label>
        <Input
          id="fileSize"
          value={data.fileSize}
          onChange={(e) => onChange('fileSize', e.target.value)}
          placeholder="e.g., 150 MB"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rows" style={{ color: tokens.textPrimary }}>
          Rows <span className="text-red-500">*</span>
        </Label>
        <Input
          id="rows"
          type="number"
          value={data.rows || ''}
          onChange={(e) => onChange('rows', parseInt(e.target.value) || 0)}
          placeholder="Number of rows"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cols" style={{ color: tokens.textPrimary }}>
          Columns <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cols"
          type="number"
          value={data.cols || ''}
          onChange={(e) => onChange('cols', parseInt(e.target.value) || 0)}
          placeholder="Number of columns"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="compressionType" style={{ color: tokens.textPrimary }}>
          Compression Type
        </Label>
        <StyledSelect
          options={[...COMPRESSION_TYPES].map(type => ({ label: type, value: type }))}
          value={data.compressionType || 'NONE'}
          onValueChange={(value) => onChange('compressionType', value === 'NONE' ? undefined : value)}
          placeholder="Select compression"
          disabled={disabled}
          tokens={tokens}
          isDark={isDark}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="encoding" style={{ color: tokens.textPrimary }}>
          Encoding
        </Label>
        <Input
          id="encoding"
          value={data.encoding || 'UTF-8'}
          onChange={(e) => onChange('encoding', e.target.value)}
          placeholder="e.g., UTF-8"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>
    </div>
  );
}
