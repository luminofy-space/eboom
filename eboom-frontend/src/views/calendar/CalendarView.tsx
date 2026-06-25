"use client";

import { useCallback, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { Typography } from "@/components/ui/typography";
import { useCanvas } from "@/src/hooks/useCanvas";
import { useCanvasPermissions } from "@/src/hooks/useCanvasPermissions";
import { useCalendarData, type CalendarEvent } from "@/src/hooks/useCalendarData";
import { EventModal } from "@/src/components/EventModal";
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

function monthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
  return { start, end };
}

function eventClassNames(event: CalendarEvent): string[] {
  const classes = [event.type === "income" ? styles.incomeEvent : styles.expenseEvent];
  if (event.status === "overdue") classes.push(styles.overdue);
  if (event.isPredicted) classes.push(styles.predicted);
  return classes;
}

export default function CalendarView() {
  const { t, i18n } = useTranslation("calendar");
  const { canvas } = useCanvas();
  const { canEdit } = useCanvasPermissions();
  const initialRange = useMemo(() => monthRange(new Date()), []);
  const [range, setRange] = useState(initialRange);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<HoveredEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
        title: `${event.info ?? event.type} ${event.amount} ${event.currency}`,
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

  const handleEventMouseEnter = useCallback((info: CalendarEventHoverArg) => {
    const event = info.event.extendedProps.event;
    if (!event) return;

    const tooltipWidth = 280;
    const tooltipHeight = 210;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const x = Math.min(info.jsEvent.clientX + 14, viewportWidth - tooltipWidth - 12);
    const y = Math.min(info.jsEvent.clientY + 14, viewportHeight - tooltipHeight - 12);

    setHoveredEvent({
      event,
      x: Math.max(12, x),
      y: Math.max(12, y),
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
    <Stack gap={4} className="pb-8">
      <Container>
        <Stack gap={1}>
          <Typography variant="heading">{t("title")}</Typography>
          <Typography variant="muted-sm">{t("subtitle")}</Typography>
        </Stack>
      </Container>

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

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          timeZone="UTC"
          events={calendarEvents}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          eventContent={renderEventContent}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek,dayGridDay",
          }}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
          allDayText={t("allDay")}
          buttonText={{
            today: t("today"),
            month: t("month"),
            week: t("week"),
            day: t("day"),
          }}
        />

        {hoveredEvent && (
          <div
            className={styles.eventTooltip}
            style={{ left: hoveredEvent.x, top: hoveredEvent.y }}
            role="tooltip"
          >
            <div className={styles.tooltipHeader}>
              <span
                className={`${styles.tooltipTypeDot} ${
                  hoveredEvent.event.type === "income" ? styles.incomeDot : styles.expenseDot
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
    </Stack>
  );
}
