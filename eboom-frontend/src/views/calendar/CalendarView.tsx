"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import { AlertTriangle, ChevronLeft, ChevronRight, Target } from "lucide-react";
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
import { NewTransferModal } from "@/src/views/wallets/components/NewTransferModal";
import { GoalFormModal } from "@/src/views/budget-planning/components/GoalFormModal";
import { useTranslation } from "react-i18next";
import { formatDate, formatNumber } from "@/src/i18n/formatters";
import styles from "@/app/(dashboard)/calendar/calendar.module.css";
import { CalendarSkeleton } from "@/src/views/calendar/components/CalendarSkeleton";
import { useSidebar } from "@/components/ui/sidebar";

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
        : event.type === "goal"
          ? styles.goalEvent
          : styles.transferEvent,
  ];
  if (event.status === "overdue") classes.push(styles.overdue);
  if (event.isPredicted) classes.push(styles.predicted);
  return classes;
}

function eventTitle(event: CalendarEvent): string {
  if (event.type === "goal") return event.info ?? "Goal";
  return `${event.info ?? event.type} ${formatNumber(Number(event.amount) || 0, { preset: "compact" })} ${event.currency}`;
}

function tooltipDotClass(type: CalendarEvent["type"]): string {
  if (type === "income") return styles.incomeDot;
  if (type === "expense") return styles.expenseDot;
  if (type === "goal") return styles.goalDot;
  return styles.transferDot;
}

type CalendarViewType = "dayGridMonth" | "dayGridWeek" | "dayGridDay";

export default function CalendarView() {
  const { t } = useTranslation("calendar");
  const { t: tc } = useTranslation("common");
  const emDash = tc("empty.emDash");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const calendarRef = useRef<FullCalendar>(null);
  const calendarHostRef = useRef<HTMLDivElement>(null);
  const { state: sidebarState, openMobile } = useSidebar();
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
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [createTransferOpen, setCreateTransferOpen] = useState(false);
  const [createEntryDate, setCreateEntryDate] = useState<string | null>(null);
  const [createPaymentDate, setCreatePaymentDate] = useState<string | null>(null);
  const [createGoalDate, setCreateGoalDate] = useState<string | null>(null);
  const [createTransferDate, setCreateTransferDate] = useState<string | null>(null);

  const monthDayMaxEvents = 1 ;
  const dayMaxEvents = calendarView === "dayGridMonth" ? monthDayMaxEvents : false;

  const { events, isLoading, error } = useCalendarData(canvas, range.start, range.end);

  const refreshCalendarLayout = useCallback(() => {
    calendarRef.current?.getApi().updateSize();
  }, []);

  useEffect(() => {
    const host = calendarHostRef.current;
    if (!host) return;

    const observer = new ResizeObserver(() => {
      refreshCalendarLayout();
    });
    observer.observe(host);

    return () => observer.disconnect();
  }, [refreshCalendarLayout]);

  useEffect(() => {
    refreshCalendarLayout();
    const timeoutId = window.setTimeout(refreshCalendarLayout, 220);
    return () => window.clearTimeout(timeoutId);
  }, [sidebarState, openMobile, refreshCalendarLayout]);

  useEffect(() => {
    if (!isLoading) refreshCalendarLayout();
  }, [isLoading, refreshCalendarLayout]);

  const calendarEvents = useMemo(
    () =>
      events.map((event) => ({
        id: String(event.id),
        title: eventTitle(event),
        start: event.date,
        allDay: true,
        display: "block",
        classNames: eventClassNames(event),
        extendedProps: { event },
      })),
    [events]
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
    window.requestAnimationFrame(refreshCalendarLayout);
  }, [refreshCalendarLayout]);

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

  const handleChooseGoal = useCallback(() => {
    if (!selectedDate) return;
    setCreateGoalDate(selectedDate);
    setChoiceModalOpen(false);
    setSelectedDate(null);
    setCreateGoalOpen(true);
  }, [selectedDate]);

  const handleChooseTransfer = useCallback(() => {
    if (!selectedDate) return;
    setCreateTransferDate(selectedDate);
    setChoiceModalOpen(false);
    setSelectedDate(null);
    setCreateTransferOpen(true);
  }, [selectedDate]);

  const handleChoiceModalOpenChange = useCallback((open: boolean) => {
    setChoiceModalOpen(open);
    if (!open) setSelectedDate(null);
  }, []);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return "";
    return formatDate(`${selectedDate}T00:00:00Z`, { preset: "short", fallback: emDash });
  }, [selectedDate, emDash]);

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
      if (event.type === "goal") {
        return (
          <div className={`${styles.eventBadge} ${eventClassNames(event).join(" ")}`}>
            <Target className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{event.info}</span>
          </div>
        );
      }
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

        {error && (
          <Typography variant="muted-sm" className="mb-2 text-destructive">
            {t("loadError")}
          </Typography>
        )}

        <div ref={calendarHostRef} className={styles.calendarHost}>
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

          {isLoading ? <CalendarSkeleton /> : null}

          <div className={cn(isLoading && "sr-only")} aria-hidden={isLoading}>
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
                className={`${styles.tooltipTypeDot} ${tooltipDotClass(hoveredEvent.event.type)}`}
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
              {hoveredEvent.event.type === "goal" ? (
                <>
                  <div>
                    <span>{t("goalTargetAmount")}</span>
                    <strong>
                      {formatNumber(Number(hoveredEvent.event.amount) || 0, {
                        preset: "compact",
                      })}{" "}
                      {hoveredEvent.event.currency}
                    </strong>
                  </div>
                  <div>
                    <span>{t("goalProgress")}</span>
                    <strong>{Math.round(hoveredEvent.event.goalPercent ?? 0)}%</strong>
                  </div>
                  <div>
                    <span>{t("goalTargetDate")}</span>
                    <strong>
                      {formatDate(hoveredEvent.event.date, {
                        preset: "short",
                        fallback: emDash,
                      })}
                    </strong>
                  </div>
                  {hoveredEvent.event.daysRemaining != null && (
                    <div>
                      <span>{t("goalDaysLeft")}</span>
                      <strong>
                        {hoveredEvent.event.daysRemaining >= 0
                          ? t("goalDaysLeftValue", {
                              count: hoveredEvent.event.daysRemaining,
                            })
                          : t("statusOverdue")}
                      </strong>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <span>{t("amount")}</span>
                    <strong>
                      {formatNumber(Number(hoveredEvent.event.amount) || 0, {
                        preset: "compact",
                      })}{" "}
                      {hoveredEvent.event.currency}
                    </strong>
                  </div>
                  {hoveredEvent.event.type === "transfer" &&
                    hoveredEvent.event.secondaryAmount &&
                    hoveredEvent.event.secondaryCurrency && (
                      <div>
                        <span>{t("sourceAmount")}</span>
                        <strong>
                          {formatNumber(Number(hoveredEvent.event.secondaryAmount) || 0, {
                            preset: "compact",
                          })}{" "}
                          {hoveredEvent.event.secondaryCurrency}
                        </strong>
                      </div>
                    )}
                  <div>
                    <span>{t("date")}</span>
                    <strong>
                      {formatDate(hoveredEvent.event.date, {
                        preset: "short",
                        fallback: emDash,
                      })}
                    </strong>
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
                </>
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
          onChooseGoal={handleChooseGoal}
          onChooseTransfer={handleChooseTransfer}
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
          <GoalFormModal
            open={createGoalOpen}
            onOpenChange={(open) => {
              setCreateGoalOpen(open);
              if (!open) setCreateGoalDate(null);
            }}
            canvasId={canvas}
            defaultTargetDate={createGoalDate ?? undefined}
            extraInvalidateKeys={[["calendar"]]}
          />
          <NewTransferModal
            open={createTransferOpen}
            onOpenChange={(open) => {
              setCreateTransferOpen(open);
              if (!open) setCreateTransferDate(null);
            }}
            defaultTransferDate={createTransferDate ?? undefined}
            extraInvalidateKeys={[["calendar"]]}
          />
        </>
      )}
    </Stack>
  );
}
