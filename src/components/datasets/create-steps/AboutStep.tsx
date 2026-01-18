'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { UpsertAboutInfoRequest } from '@/types/dataset-proposal.types';

interface AboutStepProps {
  data: UpsertAboutInfoRequest;
  onChange: (field: keyof UpsertAboutInfoRequest, value: string) => void;
  disabled?: boolean;
  tokens: any;
}

export function AboutStep({ data, onChange, disabled, tokens }: AboutStepProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="overview" style={{ color: tokens.textPrimary }}>
          Overview <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="overview"
          value={data.overview}
          onChange={(e) => onChange('overview', e.target.value)}
          placeholder="Brief summary of the dataset"
          rows={3}
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" style={{ color: tokens.textPrimary }}>
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Detailed description of the dataset"
          rows={5}
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dataQuality" style={{ color: tokens.textPrimary }}>
          Data Quality <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="dataQuality"
          value={data.dataQuality}
          onChange={(e) => onChange('dataQuality', e.target.value)}
          placeholder="Quality metrics, validation processes, completeness"
          rows={4}
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="useCases" style={{ color: tokens.textPrimary }}>
          Use Cases
        </Label>
        <Textarea
          id="useCases"
          value={data.useCases || ''}
          onChange={(e) => onChange('useCases', e.target.value)}
          placeholder="Potential applications and use cases"
          rows={4}
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="limitations" style={{ color: tokens.textPrimary }}>
          Limitations
        </Label>
        <Textarea
          id="limitations"
          value={data.limitations || ''}
          onChange={(e) => onChange('limitations', e.target.value)}
          placeholder="Known limitations or constraints"
          rows={4}
          disabled={disabled}
          style={{
            background: tokens.inputBg,
            borderColor: tokens.inputBorder,
            color: tokens.textPrimary,
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="methodology" style={{ color: tokens.textPrimary }}>
          Methodology
        </Label>
        <Textarea
          id="methodology"
          value={data.methodology || ''}
          onChange={(e) => onChange('methodology', e.target.value)}
          placeholder="Data collection and processing methodology"
          rows={4}
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
