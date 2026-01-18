'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DATASET_TYPES, DATASET_CATEGORIES } from '@/constants/dataset.constants';
import type { DatasetSuperType } from '@/types/dataset-proposal.types';

interface BasicInfoStepProps {
  data: {
    title: string;
    superType: DatasetSuperType | '';
    primaryCategoryId: string;
    sourceId: string;
    license: string;
  };
  onChange: (field: string, value: any) => void;
  disabled?: boolean;
  tokens: any;
}

export function BasicInfoStep({ data, onChange, disabled, tokens }: BasicInfoStepProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title" style={{ color: tokens.textPrimary }}>
          Dataset Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="e.g., Financial Q4 2023 Report"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="superType" style={{ color: tokens.textPrimary }}>
          Dataset Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={data.superType}
          onValueChange={(value) => onChange('superType', value)}
          disabled={disabled}
        >
          <SelectTrigger
            style={{
              background: tokens.inputBg,
              borderColor: tokens.inputBorder,
              color: tokens.textPrimary,
            }}
          >
            <SelectValue placeholder="Select dataset type" />
          </SelectTrigger>
          <SelectContent>
            {DATASET_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="primaryCategoryId" style={{ color: tokens.textPrimary }}>
          Primary Category ID <span className="text-red-500">*</span>
        </Label>
        <Input
          id="primaryCategoryId"
          value={data.primaryCategoryId}
          onChange={(e) => onChange('primaryCategoryId', e.target.value)}
          placeholder="Enter category ID"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceId" style={{ color: tokens.textPrimary }}>
          Source ID <span className="text-red-500">*</span>
        </Label>
        <Input
          id="sourceId"
          value={data.sourceId}
          onChange={(e) => onChange('sourceId', e.target.value)}
          placeholder="Enter source ID"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="license" style={{ color: tokens.textPrimary }}>
          License <span className="text-red-500">*</span>
        </Label>
        <Input
          id="license"
          value={data.license}
          onChange={(e) => onChange('license', e.target.value)}
          placeholder="e.g., MIT, Apache-2.0, Proprietary"
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>
    </>
  );
}
