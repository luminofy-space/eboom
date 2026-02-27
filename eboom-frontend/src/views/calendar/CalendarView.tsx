import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery } from '@/src/api/useQuery';
import { useCanvas } from '@/src/hooks/useCanvas';

interface CalendarEvent {
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor?: string;
  borderColor?: string;
}

export const CalendarView = () => {
  const { canvas } = useCanvas();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  const { data, isLoading } = useQuery<any>({
    queryKey: ['calendar', canvas?.id, dateRange],
    url: `/calendar/${canvas?.id}/calendar?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`,
    enabled: !!canvas?.id,
  });

  useEffect(() => {
    if (data) {
      const formattedEvents: CalendarEvent[] = [];
      Object.keys(data).forEach((date) => {
        data[date].forEach((event: any) => {
          formattedEvents.push({
            title: event.name,
            start: date,
            allDay: true,
            backgroundColor: event.type === 'income' ? '#4CAF50' : '#F44336',
            borderColor: event.type === 'income' ? '#4CAF50' : '#F44336',
          });
        });
      });
      setEvents(formattedEvents);
    }
  }, [data]);

  const handleDatesSet = (arg: any) => {
    setDateRange({ start: arg.start, end: arg.end });
  };

  return (
    <div className="p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        datesSet={handleDatesSet}
        loading={isLoading}
      />
    </div>
  );
};
