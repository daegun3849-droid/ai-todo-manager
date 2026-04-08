"use client";

/**
 * 날짜+시간 선택 컴포넌트
 * 달력 팝업으로 날짜 선택, 시간은 텍스트 입력
 */

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  label?: string;
  labelColor?: string;
  placeholder?: string;
  timeColor?: string;
}

const formatKo = (dateStr: string) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  } catch {
    return null;
  }
};

const getTimePart = (dateStr: string) => {
  if (!dateStr) return "00:00";
  const t = dateStr.split("T")[1];
  return t ? t.slice(0, 5) : "00:00";
};

const getDatePart = (dateStr: string) => {
  if (!dateStr) return undefined;
  const d = dateStr.split("T")[0];
  if (!d) return undefined;
  const parsed = new Date(d + "T00:00:00");
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

/**
 * 날짜+시간 선택 피커
 */
const DateTimePicker = ({
  value,
  onChange,
  label,
  labelColor = "text-slate-400",
  placeholder = "날짜 선택",
  timeColor = "text-slate-700",
}: DateTimePickerProps) => {
  const [open, setOpen] = React.useState(false);

  const selectedDate = getDatePart(value);
  const timePart = getTimePart(value);
  const displayDate = formatKo(value);

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, "0");
    const dd = String(day.getDate()).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}T${timePart}`);
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (value) {
      const datePart = value.split("T")[0] ?? "";
      onChange(`${datePart}T${newTime}`);
    } else {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      onChange(`${yyyy}-${mm}-${dd}T${newTime}`);
    }
  };

  return (
    <div className="flex-1 min-w-0">
      {label && (
        <label className={cn("text-[11px] md:text-[13px] font-black block mb-1", labelColor)}>
          {label}
        </label>
      )}
      <div className="bg-[#F8F9FD] rounded-xl p-3 md:p-4 flex flex-col gap-2">
        {/* 달력 팝업 트리거 */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full text-left text-[12px] md:text-[14px] font-bold text-slate-700 flex items-center gap-2"
            >
              <span className="text-[16px]">📅</span>
              <span className={displayDate ? "text-slate-800" : "text-slate-300"}>
                {displayDate ?? placeholder}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDaySelect}
              initialFocus
              locale={undefined}
            />
          </PopoverContent>
        </Popover>

        {/* 시간 입력 (24시간제 강제) */}
        <input
          type="time"
          value={timePart}
          onChange={handleTimeChange}
          step="300"
          className={cn(
            "w-full bg-transparent text-[13px] md:text-[14px] font-black outline-none border-none [&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-datetime-edit-hour-field]:text-inherit",
            timeColor
          )}
          style={{ fontVariantNumeric: "tabular-nums" }}
        />
      </div>
    </div>
  );
};

export { DateTimePicker };
