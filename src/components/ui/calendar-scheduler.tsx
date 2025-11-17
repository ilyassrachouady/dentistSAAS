"use client";

import * as React from "react";
import { format, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarSchedulerProps {
  timeSlots?: string[];
  onConfirm?: (value: { date?: Date; time?: string }) => void;
  onDateChange?: (date: Date | undefined) => void;
  disabledDates?: (date: Date) => boolean;
}

// Helper to generate consistent random availability for a date
const getDateAvailability = (date: Date): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  const hash = dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return hash % 5 !== 0; // ~80% available, ~20% fully booked
};

// Helper to generate consistent random availability for a time slot
const getTimeSlotAvailability = (date: Date, time: string): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  // First check if the entire day is unavailable
  if (!getDateAvailability(date)) {
    return false; // Entire day is unavailable
  }
  const combined = `${dateStr}-${time}`;
  const hash = combined.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return hash % 2 === 0;
};

// Helper to check if any time slot is available on a given date
const hasAvailableSlots = (date: Date, slots: string[]): boolean => {
  return slots.some(slot => getTimeSlotAvailability(date, slot));
};

function CalendarScheduler({
  timeSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ],
  onConfirm,
  onDateChange,
  disabledDates,
}: CalendarSchedulerProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = React.useState<string | undefined>();
  // Use default slots if none provided
  const slotsToUse = timeSlots && timeSlots.length > 0 ? timeSlots : [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  const handleDateSelect = (date: Date) => {
    if (disabledDates?.(date)) return;
    // Only allow selecting if day has available slots
    if (!hasAvailableSlots(date, slotsToUse)) return;
    setSelectedDate(date);
    setSelectedTime(undefined);
    onDateChange?.(date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => addDays(prev, -32));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addDays(prev, 32));
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad with previous and next month days for complete grid
  const firstDayOfWeek = getDay(monthStart);
  const prevMonthDays = Array(firstDayOfWeek).fill(null).map((_, i) => addDays(monthStart, -(firstDayOfWeek - i)));
  const allDays = [...prevMonthDays, ...calendarDays];
  
  // Add remaining days to complete the last week
  const remainingDays = 42 - allDays.length;
  const nextMonthDays = Array(remainingDays).fill(null).map((_, i) => addDays(monthEnd, i + 1));
  const gridDays = [...allDays, ...nextMonthDays];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="w-full space-y-6">
      {/* Calendar */}
      <Card className="shadow-lg border-gray-200">
        <CardContent className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevMonth}
              className="h-10 w-10 p-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy", { locale: fr })}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              className="h-10 w-10 p-0"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-500 h-10 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {gridDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isPastDate = isBefore(day, today);
              const isExternallyDisabled = disabledDates?.(day);
              const dayHasAvailableSlots = isCurrentMonth && !isPastDate && !isExternallyDisabled && hasAvailableSlots(day, slotsToUse);
              const isToday = isSameDay(day, today);

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day)}
                  disabled={!dayHasAvailableSlots || isExternallyDisabled || isPastDate}
                  className={cn(
                    "h-10 rounded-lg font-medium text-sm transition-all",
                    isCurrentMonth ? "text-gray-900" : "text-gray-300",
                    isSelected && "bg-blue-600 text-white shadow-md ring-2 ring-blue-500 ring-offset-2",
                    !isSelected && dayHasAvailableSlots && "bg-green-100 text-green-900 border-2 border-green-300 hover:bg-green-200 cursor-pointer",
                    !isSelected && !dayHasAvailableSlots && isCurrentMonth && !isPastDate && !isExternallyDisabled && "bg-red-100 text-red-900 border-2 border-red-300 cursor-not-allowed opacity-60",
                    (isPastDate || isExternallyDisabled) && !isSelected && "opacity-50 cursor-not-allowed bg-gray-100",
                    isToday && !isSelected && "ring-2 ring-blue-300",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time Slots */}
      {selectedDate && (
        <Card className="shadow-lg border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Créneaux disponibles pour {format(selectedDate, "EEEE d MMMM", { locale: fr })}
            </h3>
            {slotsToUse.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun créneau disponible pour cette date
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {slotsToUse.map((slot) => {
                  const isAvailable = getTimeSlotAvailability(selectedDate, slot);
                  const isSelected = selectedTime === slot;
                  
                  return (
                    <Button
                      key={slot}
                      onClick={() => {
                        if (isAvailable) setSelectedTime(slot);
                      }}
                      disabled={!isAvailable}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "h-12 transition-all font-semibold",
                        isSelected && "bg-blue-600 hover:bg-blue-700 text-white shadow-md",
                        !isSelected && isAvailable && "bg-green-100 text-green-900 border-2 border-green-300 hover:bg-green-200",
                        !isSelected && !isAvailable && "bg-red-100 text-red-900 border-2 border-red-300 cursor-not-allowed opacity-60",
                      )}
                    >
                      {slot}
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedDate(undefined);
            setSelectedTime(undefined);
            setCurrentMonth(new Date());
          }}
          className="px-6 h-12"
        >
          Réinitialiser
        </Button>
        <Button
          onClick={() => onConfirm?.({ date: selectedDate, time: selectedTime })}
          disabled={!selectedDate || !selectedTime}
          className="px-8 h-12 bg-blue-600 hover:bg-blue-700"
        >
          Confirmer
        </Button>
      </div>
    </div>
  );
}

export { CalendarScheduler };
