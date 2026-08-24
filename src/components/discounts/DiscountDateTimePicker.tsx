"use client";

import { CalendarDays } from "lucide-react";

import { DashboardInput } from "@/components/dashboard";

interface DiscountDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DiscountDateTimePicker({
  value,
  onChange,
  disabled = false,
}: DiscountDateTimePickerProps) {
  return (
    <div className="relative">
      <DashboardInput
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="pr-10 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 dark:[color-scheme:dark]"
      />
      <CalendarDays
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  );
}
