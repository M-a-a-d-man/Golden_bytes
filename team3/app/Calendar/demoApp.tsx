"use client"
import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateSelectArg, EventClickArg } from '@fullcalendar/core'
import EventDialog from './Dialog';
import momentPlugin from '@fullcalendar/moment';
import moment from 'moment';

// Type for our stored event
interface StoredEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  startStr?: string;
  endStr?: string;
  description?: string;
  location?: string;
  allDay?: boolean;
  backgroundColor?: string;
  timeBreakdown?: {
    estimatedTotalHours: number;
    readingTime: number;
    researchTime: number;
    writingTime: number;
    reviewTime: number;
    bufferTime: number;
    isTimeWindowSufficient: boolean;
    recommendedStartTime: string;
    recommendedEndTime: string;
  };
  schedulingNotes?: {
    conflicts: string[];
    optimalTimeOfDay: string;
    recommendedBreaks: string[];
  };
  ChatGptComment?: string;
  FirstQuestion?: string;
}

export default function CalendarComponent() {
  const [currentEvents, setCurrentEvents] = useState<StoredEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<StoredEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  // Fetch events from localStorage
  useEffect(() => {
    const storedEvents = localStorage.getItem('calendarEvents');
    if (storedEvents) {
      setCurrentEvents(JSON.parse(storedEvents));
    }
    setIsLoading(false);
  }, []);

  // Save events to localStorage when they change
  useEffect(() => {
    if (currentEvents.length > 0) {
      localStorage.setItem('calendarEvents', JSON.stringify(currentEvents));
    }
  }, [currentEvents]);

  function handleDateSelect(selectInfo: DateSelectArg) {
    setSelectedEvent(null);
    setSelectedStart(selectInfo.start);
    setSelectedEnd(selectInfo.end);
    setIsDialogOpen(true);
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event;
    const eventData = currentEvents.find(e => e.id === event.id);
    
    if (eventData) {
      setSelectedEvent(eventData);
      setSelectedStart(new Date(eventData.start));
      setSelectedEnd(new Date(eventData.end));
      setIsDialogOpen(true);
    }
  }

  function handleDialogClose() {
    setIsDialogOpen(false);
    setSelectedStart(null);
    setSelectedEnd(null);
    setSelectedEvent(null);
  }

  function handleEventDelete(eventId: string) {
    const updatedEvents = currentEvents.filter(event => event.id !== eventId);
    setCurrentEvents(updatedEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
  }

  async function handleDialogSave(eventData: StoredEvent) {
    const existingEventIndex = currentEvents.findIndex(e => e.id === eventData.id);
    
    if (existingEventIndex >= 0) {
      // Update existing event
      const updatedEvents = [...currentEvents];
      updatedEvents[existingEventIndex] = eventData;
      setCurrentEvents(updatedEvents);
    } else {
      // Add new event
      setCurrentEvents([...currentEvents, eventData]);
    }
    
    handleDialogClose();
  }

  async function handlePlanForMe(formData: {
    title: string;
    description?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    location?: string;
    file: File | null;
  }) {
    if (!formData.file) {
      alert("Please upload an assignment file");
      return null;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", formData.file);
      formDataToSend.append("title", formData.title);
      
      // Use the selected dates from the calendar if not provided in the form
      const startDate = formData.startDate || (selectedStart ? moment(selectedStart).format('YYYY-MM-DD') : '');
      const startTime = formData.startTime || (selectedStart ? moment(selectedStart).format('HH:mm') : '');
      const endDate = formData.endDate || (selectedEnd ? moment(selectedEnd).format('YYYY-MM-DD') : '');
      const endTime = formData.endTime || (selectedEnd ? moment(selectedEnd).format('HH:mm') : '');
      
      formDataToSend.append("start", `${startDate}T${startTime}:00.000Z`);
      formDataToSend.append("end", `${endDate}T${endTime}:00.000Z`);

      const response = await fetch('/api/openai', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to process assignment');
      }

      const result = await response.json();
      
      // Create a new event with the AI response
      const newEvent: StoredEvent = {
        id: result.id || `event-${Date.now()}-${formData.title.replace(/\s+/g, '').toLowerCase()}`,
        title: formData.title,
        start: result.start,
        end: result.end,
        startStr: result.startStr,
        endStr: result.endStr,
        description: result.description || formData.description,
        location: result.location || formData.location,
        allDay: result.allDay || false,
        ChatGptComment: result.ChatGptComment,
        FirstQuestion: result.FirstQuestion,
        timeBreakdown: result.timeBreakdown,
        schedulingNotes: result.schedulingNotes
      };
      
      // Add the event to the calendar
      setCurrentEvents([...currentEvents, newEvent]);
      handleDialogClose();
      
      return newEvent;
    } catch (error) {
      console.error('Error planning assignment:', error);
      alert('Failed to plan assignment. Please try again.');
      return null;
    }
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1 className="text-2xl font-bold mb-4">Assignment Calendar</h1>
        <p className="mb-4">Click on a time slot to add an assignment</p>
      </div>
      
      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, momentPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView="timeGridWeek"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={currentEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
        />
      </div>
      
      <EventDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
        onDelete={handleEventDelete}
        onPlanForMe={handlePlanForMe}
        selectedStart={selectedStart}
        selectedEnd={selectedEnd}
        selectedEvent={selectedEvent}
      />
    </div>
  );
}
