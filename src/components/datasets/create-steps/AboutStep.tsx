'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { UpsertAboutInfoRequest } from '@/types/dataset-proposal.types';

interface AboutStepProps {
  data: UpsertAboutInfoRequest;
  onChange: (field: keyof UpsertAboutInfoRequest, value: string) => void;
  locationData: {
    country: string;
    state: string;
    city: string;
    region: string;
    coordinates: string;
    coverage: string;
  };
  onLocationChange: (field: string, value: string) => void;
  tagsText: string;
  onTagsChange: (value: string) => void;
  disabled?: boolean;
  tokens: any;
}

export function AboutStep({ data, onChange, locationData, onLocationChange, tagsText, onTagsChange, disabled, tokens }: AboutStepProps) {
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

      <div className="pt-2 border-t" style={{ borderColor: tokens.borderDefault }}>
        <h4 className="text-sm font-semibold mb-3" style={{ color: tokens.textPrimary }}>
          Location Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country" style={{ color: tokens.textPrimary }}>
              Country <span className="text-red-500">*</span>
            </Label>
            <Input
              id="country"
              value={locationData.country}
              onChange={(e) => onLocationChange('country', e.target.value)}
              placeholder="e.g., India"
              disabled={disabled}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" style={{ color: tokens.textPrimary }}>
              State
            </Label>
            <Input
              id="state"
              value={locationData.state}
              onChange={(e) => onLocationChange('state', e.target.value)}
              placeholder="e.g., Maharashtra"
              disabled={disabled}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" style={{ color: tokens.textPrimary }}>
              City
            </Label>
            <Input
              id="city"
              value={locationData.city}
              onChange={(e) => onLocationChange('city', e.target.value)}
              placeholder="e.g., Mumbai"
              disabled={disabled}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region" style={{ color: tokens.textPrimary }}>
              Region
            </Label>
            <Input
              id="region"
              value={locationData.region}
              onChange={(e) => onLocationChange('region', e.target.value)}
              placeholder="e.g., South Asia"
              disabled={disabled}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coordinates" style={{ color: tokens.textPrimary }}>
              Coordinates
            </Label>
            <Input
              id="coordinates"
              value={locationData.coordinates}
              onChange={(e) => onLocationChange('coordinates', e.target.value)}
              placeholder="e.g., 19.0760,72.8777"
              disabled={disabled}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverage" style={{ color: tokens.textPrimary }}>
              Coverage
            </Label>
            <Input
              id="coverage"
              value={locationData.coverage}
              onChange={(e) => onLocationChange('coverage', e.target.value)}
              placeholder="e.g., National"
              disabled={disabled}
              style={{
                background: tokens.inputBg,
                borderColor: tokens.inputBorder,
                color: tokens.textPrimary,
              }}
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t space-y-2" style={{ borderColor: tokens.borderDefault }}>
        <Label htmlFor="tags" style={{ color: tokens.textPrimary }}>
          Tags (free-text, comma-separated)
        </Label>
        <Input
          id="tags"
          value={tagsText}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="e.g., agriculture, crop yield, india"
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
