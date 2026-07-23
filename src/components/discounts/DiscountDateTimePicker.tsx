"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";

import { getDatasetThemeTokens } from "@/constants/dataset.constants";

interface DiscountDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  tokens: ReturnType<typeof getDatasetThemeTokens>;
  isDark?: boolean;
}

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
const hours = Array.from({ length: 24 }, (_, index) =>
  index.toString().padStart(2, "0")
);
const minuteOptions = ["00", "15", "30", "45"];

const parseLocalValue = (value: string) => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const toLocalInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const isSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const monthLabel = (date: Date) =>
  date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const displayLabel = (value: string) =>
  parseLocalValue(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function DiscountDateTimePicker({
  value,
  onChange,
  disabled = false,
  tokens,
  isDark = false,
}: DiscountDateTimePickerProps) {
  const selectedDate = useMemo(() => parseLocalValue(value), [value]);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setViewDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    );
  }, [selectedDate.getFullYear(), selectedDate.getMonth()]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const visibleDays = useMemo(() => {
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());
    const days: Date[] = [];

    for (let index = 0; index < 42; index += 1) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      days.push(day);
    }

    return days;
  }, [viewDate]);

  const updateDate = (date: Date) => {
    const next = new Date(date);
    next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    onChange(toLocalInputValue(next));
  };

  const updateTime = (nextHours: number, nextMinutes: number) => {
    const next = new Date(selectedDate);
    next.setHours(nextHours, nextMinutes, 0, 0);
    onChange(toLocalInputValue(next));
  };

  const setRelativeMonth = (offset: number) => {
    setViewDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1)
    );
  };

  const setToday = () => {
    const now = new Date();
    onChange(toLocalInputValue(now));
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const currentMinute = selectedDate.getMinutes().toString().padStart(2, "0");
  const minutes = minuteOptions.includes(currentMinute)
    ? minuteOptions
    : [...minuteOptions, currentMinute].sort();
  const glassPanel = isDark
    ? "rgba(16, 24, 48, 0.86)"
    : "rgba(255, 255, 255, 0.92)";
  const glassButton = isDark
    ? "rgba(255, 255, 255, 0.07)"
    : "rgba(255, 255, 255, 0.74)";
  const glassButtonHover = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(26, 34, 64, 0.06)";
  const activeBg = isDark
    ? "rgba(255, 255, 255, 0.14)"
    : "rgba(26, 34, 64, 0.08)";
  const activeBorder = isDark
    ? "rgba(255, 255, 255, 0.24)"
    : "rgba(26, 34, 64, 0.18)";
  const activeText = tokens.textPrimary;
  const todayBg = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(26, 34, 64, 0.04)";
  const todayBorder = isDark
    ? "rgba(255, 255, 255, 0.16)"
    : "rgba(26, 34, 64, 0.12)";

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center justify-between rounded-md border px-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: isDark
            ? "rgba(255, 255, 255, 0.06)"
            : "rgba(255, 255, 255, 0.76)",
          borderColor: open
            ? isDark
              ? "rgba(255, 255, 255, 0.22)"
              : "rgba(26, 34, 64, 0.16)"
            : tokens.borderDefault,
          color: tokens.textPrimary,
          boxShadow: open
            ? isDark
              ? "0 0 0 1px rgba(255, 255, 255, 0.08)"
              : "0 0 0 1px rgba(26, 34, 64, 0.08)"
            : "none",
          backdropFilter: "blur(16px)",
        }}
      >
        <span className="truncate">{displayLabel(value)}</span>
        <CalendarDays className="h-4 w-4" style={{ color: tokens.textMuted }} />
      </button>

      {open && !disabled && (
        <div
          className="fixed left-1/2 top-1/2 z-50 w-[min(780px,calc(100vw-32px))] max-h-[calc(100vh-96px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border shadow-2xl backdrop-blur-2xl"
          style={{
            background: glassPanel,
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.14)"
              : "rgba(255, 255, 255, 0.65)",
            color: tokens.textPrimary,
            boxShadow: isDark
              ? "0 24px 70px rgba(0, 0, 0, 0.45)"
              : "0 24px 70px rgba(26, 34, 64, 0.16)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRelativeMonth(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border transition-colors"
                  style={{
                    background: glassButton,
                    borderColor: tokens.borderDefault,
                    color: tokens.textPrimary,
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = glassButtonHover;
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = glassButton;
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <p className="text-sm font-semibold">
                    {monthLabel(viewDate)}
                  </p>
                  <p className="text-xs" style={{ color: tokens.textMuted }}>
                    Choose campaign date
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRelativeMonth(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border transition-colors"
                  style={{
                    background: glassButton,
                    borderColor: tokens.borderDefault,
                    color: tokens.textPrimary,
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = glassButtonHover;
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = glassButton;
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, index) => (
                  <div
                    key={`${day}-${index}`}
                    className="flex h-8 items-center justify-center text-xs font-semibold"
                    style={{ color: tokens.textMuted }}
                  >
                    {day}
                  </div>
                ))}
                {visibleDays.map((day) => {
                  const inCurrentMonth = day.getMonth() === viewDate.getMonth();
                  const selected = isSameDay(day, selectedDate);
                  const today = isSameDay(day, new Date());

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => updateDate(day)}
                      className="flex h-10 items-center justify-center rounded-md border text-sm font-semibold transition-colors"
                      style={{
                        background: selected
                          ? activeBg
                          : today
                            ? todayBg
                            : "transparent",
                        color: selected
                          ? activeText
                          : inCurrentMonth
                            ? tokens.textPrimary
                            : tokens.textMuted,
                        opacity: inCurrentMonth ? 1 : 0.55,
                        border:
                          selected || today
                            ? `1px solid ${selected ? activeBorder : todayBorder}`
                            : "1px solid transparent",
                      }}
                      onMouseEnter={(event) => {
                        if (!selected)
                          event.currentTarget.style.background =
                            glassButtonHover;
                      }}
                      onMouseLeave={(event) => {
                        if (!selected) {
                          event.currentTarget.style.background = today
                            ? todayBg
                            : "transparent";
                        }
                      }}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={setToday}
                  className="h-9 rounded-md border px-4 text-sm font-semibold transition-colors"
                  style={{
                    background: glassButton,
                    borderColor: tokens.borderDefault,
                    color: tokens.textPrimary,
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = glassButtonHover;
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = glassButton;
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 rounded-md border px-4 text-sm font-semibold transition-colors"
                  style={{
                    background: activeBg,
                    borderColor: activeBorder,
                    color: activeText,
                  }}
                >
                  Done
                </button>
              </div>
            </div>

            <div
              className="border-t p-5 lg:border-l lg:border-t-0"
              style={{ borderColor: tokens.borderDefault }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Clock
                  className="h-4 w-4"
                  style={{ color: tokens.textMuted }}
                />
                <p className="text-sm font-semibold">Time</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {hours.map((hour) => {
                  const active = Number(hour) === selectedDate.getHours();
                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() =>
                        updateTime(Number(hour), selectedDate.getMinutes())
                      }
                      className="h-9 rounded-md text-sm font-semibold transition-colors"
                      style={{
                        background: active ? activeBg : glassButton,
                        color: active ? activeText : tokens.textPrimary,
                        border: `1px solid ${active ? activeBorder : tokens.borderDefault}`,
                      }}
                      onMouseEnter={(event) => {
                        if (!active)
                          event.currentTarget.style.background =
                            glassButtonHover;
                      }}
                      onMouseLeave={(event) => {
                        if (!active)
                          event.currentTarget.style.background = glassButton;
                      }}
                    >
                      {hour}
                    </button>
                  );
                })}
              </div>

              <p
                className="mb-2 mt-4 text-xs font-semibold uppercase"
                style={{ color: tokens.textMuted }}
              >
                Minutes
              </p>
              <div className="grid grid-cols-5 gap-2">
                {minutes.map((minute) => {
                  const active = Number(minute) === selectedDate.getMinutes();
                  return (
                    <button
                      key={minute}
                      type="button"
                      onClick={() =>
                        updateTime(selectedDate.getHours(), Number(minute))
                      }
                      className="h-9 rounded-md text-sm font-semibold transition-colors"
                      style={{
                        background: active ? activeBg : glassButton,
                        color: active ? activeText : tokens.textPrimary,
                        border: `1px solid ${active ? activeBorder : tokens.borderDefault}`,
                      }}
                      onMouseEnter={(event) => {
                        if (!active)
                          event.currentTarget.style.background =
                            glassButtonHover;
                      }}
                      onMouseLeave={(event) => {
                        if (!active)
                          event.currentTarget.style.background = glassButton;
                      }}
                    >
                      {minute}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
