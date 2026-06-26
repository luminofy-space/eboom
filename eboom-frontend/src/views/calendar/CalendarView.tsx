"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stack } from "@/components/ui/stack";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Typography } from "@/components/ui/typography";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useCalendarData, type CalendarEvent } from "@/src/hooks/useCalendarData";
import { EventModal } from "@/src/components/EventModal";
import { CalendarCreateChoiceModal } from "@/src/components/CalendarCreateChoiceModal";
import { NewIncomeEntryModal } from "@/src/views/incomes/component/NewIncomeEntryModal";
import { NewExpensePaymentModal } from "@/src/views/expenses/components/NewExpensePaymentModal";
import { useTranslation } from "react-i18next";
import styles from "@/app/(dashboard)/calendar/calendar.module.css";

type CalendarEventHoverArg = {
  event: {
    extendedProps: {
      event?: CalendarEvent;
    };
  };
  jsEvent: MouseEvent;
};

type HoveredEvent = {
  event: CalendarEvent;
  x: number;
  y: number;
};

function clampTooltipPosition(
  clientX: number,
  clientY: number,
  width: number,
  height: number
): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const x = Math.min(clientX + 14, viewportWidth - width - 12);
  const y = Math.min(clientY + 14, viewportHeight - height - 12);
  return {
    x: Math.max(12, x),
    y: Math.max(12, y),
  };
}

function monthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
  return { start, end };
}

function eventClassNames(event: CalendarEvent): string[] {
  const classes = [
    event.type === "income"
      ? styles.incomeEvent
      : event.type === "expense"
        ? styles.expenseEvent
        : styles.transferEvent,
  ];
  if (event.status === "overdue") classes.push(styles.overdue);
  if (event.isPredicted) classes.push(styles.predicted);
  return classes;
}

type CalendarViewType = "dayGridMonth" | "dayGridWeek" | "dayGridDay";

export default function CalendarView() {
  const { t, i18n } = useTranslation("calendar");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const calendarRef = useRef<FullCalendar>(null);
  const initialRange = useMemo(() => monthRange(new Date()), []);
  const [range, setRange] = useState(initialRange);
  const [calendarView, setCalendarView] = useState<CalendarViewType>("dayGridMonth");
  const [toolbarTitle, setToolbarTitle] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<HoveredEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [choiceModalOpen, setChoiceModalOpen] = useState(false);
  const [createEntryOpen, setCreateEntryOpen] = useState(false);
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [createEntryDate, setCreateEntryDate] = useState<string | null>(null);
  const [createPaymentDate, setCreatePaymentDate] = useState<string | null>(null);

  const monthDayMaxEvents = 1 ;
  const dayMaxEvents = calendarView === "dayGridMonth" ? monthDayMaxEvents : false;

  const { events, isLoading, error } = useCalendarData(canvas, range.start, range.end);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [i18n.language]
  );

  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [i18n.language]
  );

  const calendarEvents = useMemo(
    () =>
      events.map((event) => ({
        id: String(event.id),
        title: `${event.info ?? event.type} ${amountFormatter.format(Number(event.amount) || 0)} ${event.currency}`,
        start: event.date,
        allDay: true,
        display: "block",
        classNames: eventClassNames(event),
        extendedProps: { event },
      })),
    [events, amountFormatter]
  );

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setRange(monthRange(arg.view.currentStart));
    setToolbarTitle(arg.view.title);
  }, []);

  const handlePrev = useCallback(() => {
    calendarRef.current?.getApi().prev();
  }, []);

  const handleNext = useCallback(() => {
    calendarRef.current?.getApi().next();
  }, []);

  const handleToday = useCallback(() => {
    calendarRef.current?.getApi().today();
  }, []);

  const handleCalendarViewChange = useCallback((value: string) => {
    if (!value) return;
    const nextView = value as CalendarViewType;
    setCalendarView(nextView);
    calendarRef.current?.getApi().changeView(nextView);
  }, []);

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      if (!canEdit) return;
      const event = info.event.extendedProps.event as CalendarEvent;
      setSelectedEvent(event);
      setModalOpen(true);
    },
    [canEdit]
  );

  const handleDateClick = useCallback(
    (info: DateClickArg) => {
      if (!canEdit) return;
      setSelectedDate(info.dateStr.slice(0, 10));
      setChoiceModalOpen(true);
    },
    [canEdit]
  );

  const handleChooseIncomeEntry = useCallback(() => {
    if (!selectedDate) return;
    setCreateEntryDate(selectedDate);
    setChoiceModalOpen(false);
    setSelectedDate(null);
    setCreateEntryOpen(true);
  }, [selectedDate]);

  const handleChooseExpensePayment = useCallback(() => {
    if (!selectedDate) return;
    setCreatePaymentDate(selectedDate);
    setChoiceModalOpen(false);
    setSelectedDate(null);
    setCreatePaymentOpen(true);
  }, [selectedDate]);

  const handleChoiceModalOpenChange = useCallback((open: boolean) => {
    setChoiceModalOpen(open);
    if (!open) setSelectedDate(null);
  }, []);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return "";
    return dateFormatter.format(new Date(`${selectedDate}T00:00:00Z`));
  }, [selectedDate, dateFormatter]);

  const handleEventMouseEnter = useCallback((info: CalendarEventHoverArg) => {
    const event = info.event.extendedProps.event;
    if (!event) return;

    setHoveredEvent({
      event,
      ...clampTooltipPosition(info.jsEvent.clientX, info.jsEvent.clientY, 280, 210),
    });
  }, []);

  const handleEventMouseLeave = useCallback(() => {
    setHoveredEvent(null);
  }, []);

  const renderEventContent = useCallback(
    (arg: EventContentArg) => {
      const event = arg.event.extendedProps.event as CalendarEvent;
      return (
        <div className={`${styles.eventBadge} ${eventClassNames(event).join(" ")}`}>
          {event.status === "overdue" && (
            <AlertTriangle className="size-3 shrink-0" aria-hidden />
          )}
          <span className="truncate">{arg.event.title}</span>
          {event.isPredicted && (
            <span className={styles.predictedLabel}>{t("predicted")}</span>
          )}
        </div>
      );
    },
    [t]
  );

  if (!canvas) {
    return (
      <Container>
        <Stack className="h-96" align="center" justify="center">
          <Typography variant="muted-sm">{t("noCanvas")}</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Stack className="pb-2">
      <Container className={styles.calendarWrapper}>
        {isLoading && (
          <Stack direction="row" align="center" gap={2} className="mb-2">
            <Loader2 className="size-4 animate-spin" />
            <Typography variant="muted-sm">{t("loading")}</Typography>
          </Stack>
        )}

        {error && (
          <Typography variant="muted-sm" className="mb-2 text-destructive">
            {t("loadError")}
          </Typography>
        )}

        <div className={styles.calendarHost}>
          <Stack
            direction="row"
            align="center"
            gap={2}
            className={styles.calendarToolbar}
          >
            <Stack direction="row" align="center" gap={2} className={styles.calendarNav}>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handlePrev}
                aria-label={t("previous")}
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleNext}
                aria-label={t("next")}
              >
                <ChevronRight />
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleToday}>
                {t("today")}
              </Button>
            </Stack>

            <Typography variant="title" className={styles.calendarTitle}>
              {toolbarTitle}
            </Typography>

            <div className={styles.viewSwitcher}>
            <ToggleGroup
              type="single"
              value={calendarView}
              onValueChange={handleCalendarViewChange}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 md:flex"
            >
              <ToggleGroupItem value="dayGridMonth">{t("month")}</ToggleGroupItem>
              <ToggleGroupItem value="dayGridWeek">{t("week")}</ToggleGroupItem>
              <ToggleGroupItem value="dayGridDay">{t("day")}</ToggleGroupItem>
            </ToggleGroup>
            <Select value={calendarView} onValueChange={handleCalendarViewChange}>
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate md:hidden"
                size="sm"
                aria-label={`${t("month")}, ${t("week")}, ${t("day")}`}
              >
                <SelectValue placeholder={t("month")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="dayGridMonth" className="rounded-lg">
                  {t("month")}
                </SelectItem>
                <SelectItem value="dayGridWeek" className="rounded-lg">
                  {t("week")}
                </SelectItem>
                <SelectItem value="dayGridDay" className="rounded-lg">
                  {t("day")}
                </SelectItem>
              </SelectContent>
            </Select>
            </div>
          </Stack>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView={calendarView}
            timeZone="UTC"
            events={calendarEvents}
            datesSet={handleDatesSet}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            eventContent={renderEventContent}
            dayMaxEvents={dayMaxEvents}
            moreLinkText={(num) => t("moreEvents", { count: num })}
            moreLinkClick="popover"
            headerToolbar={false}
            height="auto"
            eventDisplay="block"
            allDayText={t("allDay")}
          />
        </div>

        {hoveredEvent && (
          <div
            className={cn(
              styles.eventTooltip,
              "border bg-popover text-popover-foreground shadow-md"
            )}
            style={{ left: hoveredEvent.x, top: hoveredEvent.y }}
            role="tooltip"
          >
            <div className={styles.tooltipHeader}>
              <span
                className={`${styles.tooltipTypeDot} ${
                  hoveredEvent.event.type === "income"
                    ? styles.incomeDot
                    : hoveredEvent.event.type === "expense"
                      ? styles.expenseDot
                      : styles.transferDot
                }`}
              />
              <div className={styles.tooltipTitleBlock}>
                <div className={styles.tooltipTitle}>
                  {hoveredEvent.event.info ?? t(hoveredEvent.event.type)}
                </div>
                <div className={styles.tooltipSubtitle}>
                  {t(hoveredEvent.event.type)}
                  {hoveredEvent.event.isPredicted ? ` • ${t("predicted")}` : ""}
                </div>
              </div>
            </div>

            <div className={styles.tooltipDetails}>
              <div>
                <span>{t("amount")}</span>
                <strong>
                  {amountFormatter.format(Number(hoveredEvent.event.amount) || 0)}{" "}
                  {hoveredEvent.event.currency}
                </strong>
              </div>
              {hoveredEvent.event.type === "transfer" &&
                hoveredEvent.event.secondaryAmount &&
                hoveredEvent.event.secondaryCurrency && (
                  <div>
                    <span>{t("sourceAmount")}</span>
                    <strong>
                      {amountFormatter.format(Number(hoveredEvent.event.secondaryAmount) || 0)}{" "}
                      {hoveredEvent.event.secondaryCurrency}
                    </strong>
                  </div>
                )}
              <div>
                <span>{t("date")}</span>
                <strong>{dateFormatter.format(new Date(hoveredEvent.event.date))}</strong>
              </div>
              <div>
                <span>{t("statusLabel")}</span>
                <strong>{t(`statuses.${hoveredEvent.event.status}`)}</strong>
              </div>
              <div>
                <span>{t("recordId")}</span>
                <strong>#{hoveredEvent.event.entityId}</strong>
              </div>
              {hoveredEvent.event.entryId && (
                <div>
                  <span>{t("entryId")}</span>
                  <strong>#{hoveredEvent.event.entryId}</strong>
                </div>
              )}
            </div>
          </div>
        )}

      </Container>

      {canEdit && selectedEvent && (
        <EventModal
          event={selectedEvent}
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setSelectedEvent(null);
          }}
        />
      )}

      {canEdit && selectedDate && (
        <CalendarCreateChoiceModal
          open={choiceModalOpen}
          onOpenChange={handleChoiceModalOpenChange}
          dateLabel={selectedDateLabel}
          onChooseIncomeEntry={handleChooseIncomeEntry}
          onChooseExpensePayment={handleChooseExpensePayment}
        />
      )}

      {canEdit && (
        <>
          <NewIncomeEntryModal
            open={createEntryOpen}
            onOpenChange={(open) => {
              setCreateEntryOpen(open);
              if (!open) setCreateEntryDate(null);
            }}
            defaultReceivedDate={createEntryDate ?? undefined}
            extraInvalidateKeys={[["calendar"]]}
          />
          <NewExpensePaymentModal
            open={createPaymentOpen}
            onOpenChange={(open) => {
              setCreatePaymentOpen(open);
              if (!open) setCreatePaymentDate(null);
            }}
            defaultPaidDate={createPaymentDate ?? undefined}
            extraInvalidateKeys={[["calendar"]]}
          />
        </>
      )}
    </Stack>
  );
}
