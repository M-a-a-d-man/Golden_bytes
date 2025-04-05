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
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);

  // Fetch events from localStorage
  useEffect(() => {
    const loadEvents = () => {
      try {
        setIsLoading(true);
        const storedEvents = localStorage.getItem('calendarEvents');
        if (storedEvents) {
          const parsedEvents = JSON.parse(storedEvents);
          // Validate and format dates
          const validEvents = parsedEvents.map((event: StoredEvent) => ({
            ...event,
            start: new Date(event.start).toISOString(),
            end: new Date(event.end).toISOString(),
            startStr: new Date(event.start).toISOString(),
            endStr: new Date(event.end).toISOString()
          }));
          setCurrentEvents(validEvents);
        }
      } catch (error) {
        console.error('Error loading events:', error);
        setCurrentEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Save events to localStorage when they change
  useEffect(() => {
    if (currentEvents.length > 0) {
      try {
        localStorage.setItem('calendarEvents', JSON.stringify(currentEvents));
      } catch (error) {
        console.error('Error saving events to localStorage:', error);
      }
    }
  }, [currentEvents]);

  function handleDateSelect(selectInfo: DateSelectArg) {
    setSelectedEvent(null);
    setSelectedStart(selectInfo.start);
    setSelectedEnd(selectInfo.end);
    setIsDialogOpen(true);
  }

  function handleEventClick(clickInfo: EventClickArg) {
    try {
      const event = clickInfo.event;
      const eventData = currentEvents.find(e => e.id === event.id);
      
      if (eventData) {
        const formattedEvent = {
          ...eventData,
          start: event.startStr,
          end: event.endStr,
          startStr: event.startStr,
          endStr: event.endStr
        };
        setSelectedEvent(formattedEvent);
        setSelectedStart(event.start);
        setSelectedEnd(event.end);
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error handling event click:', error);
    }
  }

  function handleDialogClose() {
    setIsDialogOpen(false);
    setSelectedStart(null);
    setSelectedEnd(null);
    setSelectedEvent(null);
  }

  function handleEventDelete(eventId: string) {
    try {
      const updatedEvents = currentEvents.filter(event => event.id !== eventId);
      setCurrentEvents(updatedEvents);
      if (updatedEvents.length === 0) {
        localStorage.removeItem('calendarEvents');
      } else {
        localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
      }
      handleDialogClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  }

  async function handleDialogSave(eventData: StoredEvent) {
    try {
      const existingEventIndex = currentEvents.findIndex(e => e.id === eventData.id);
      let updatedEvents: StoredEvent[];
      
      // Ensure dates are valid
      const validatedEvent = {
        ...eventData,
        start: new Date(eventData.start).toISOString(),
        end: new Date(eventData.end).toISOString(),
        startStr: new Date(eventData.start).toISOString(),
        endStr: new Date(eventData.end).toISOString()
      };
      
      if (existingEventIndex >= 0) {
        // Update existing event
        updatedEvents = [...currentEvents];
        updatedEvents[existingEventIndex] = validatedEvent;
      } else {
        // Add new event
        updatedEvents = [...currentEvents, validatedEvent];
      }
      
      setCurrentEvents(updatedEvents);
      localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
      handleDialogClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
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

    // Validate file
    const validFileTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validFileTypes.includes(formData.file.type)) {
      alert("Please upload a valid file (PDF, TXT, DOC, or DOCX)");
      return null;
    }

    try {
      setIsLoading(true);
      const formDataToSend = new FormData();
      
      // Add file validation logging
      console.log('File being uploaded:', {
        name: formData.file.name,
        type: formData.file.type,
        size: formData.file.size
      });

      formDataToSend.append("file", formData.file);
      formDataToSend.append("title", formData.title);
      
      // Use the selected dates from the calendar if not provided in the form
      const startDate = formData.startDate || (selectedStart ? moment(selectedStart).format('YYYY-MM-DD') : '');
      const startTime = formData.startTime || (selectedStart ? moment(selectedStart).format('HH:mm') : '');
      const endDate = formData.endDate || (selectedEnd ? moment(selectedEnd).format('YYYY-MM-DD') : '');
      const endTime = formData.endTime || (selectedEnd ? moment(selectedEnd).format('HH:mm') : '');
      
      if (!startDate || !startTime || !endDate || !endTime) {
        alert("Please select a valid date and time range");
        return null;
      }

      formDataToSend.append("start", `${startDate}T${startTime}:00.000Z`);
      formDataToSend.append("end", `${endDate}T${endTime}:00.000Z`);

      // Log the request
      console.log('Sending request to OpenAI with:', {
        title: formData.title,
        start: `${startDate}T${startTime}:00.000Z`,
        end: `${endDate}T${endTime}:00.000Z`
      });

      const response = await fetch('/api/openai', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API Error:', errorData);
        throw new Error(errorData.error || 'Failed to process assignment');
      }

      const result = await response.json();
      
      // Validate the API response
      if (!result || !result.timeBreakdown) {
        throw new Error('Invalid response from AI: Missing time breakdown');
      }

      console.log('Received AI response:', result);

      // Create multiple events based on the time breakdown
      if (result.timeBreakdown) {
        const startDateTime = moment(`${startDate}T${startTime}`);
        const endDateTime = moment(`${endDate}T${endTime}`);
        const totalDays = endDateTime.diff(startDateTime, 'days') + 1;
        const events: StoredEvent[] = [];
        
        // Calculate working hours (9 AM to 6 PM by default)
        const workingHoursStart = 9;
        const workingHoursEnd = 18;
        const hoursPerDay = workingHoursEnd - workingHoursStart;

        // Helper function to create an event
        const createEvent = (type: string, hours: number, color: string, startTime: moment.Moment) => {
          if (hours <= 0) return null;
          
          const event: StoredEvent = {
            id: `event-${Date.now()}-${type.toLowerCase()}-${formData.title.replace(/\s+/g, '')}`,
            title: `${formData.title} - ${type}`,
            start: startTime.toISOString(),
            end: startTime.clone().add(hours, 'hours').toISOString(),
            startStr: startTime.toISOString(),
            endStr: startTime.clone().add(hours, 'hours').toISOString(),
            description: formData.description || '',
            location: formData.location || '',
            allDay: false,
            backgroundColor: color,
            timeBreakdown: result.timeBreakdown,
            schedulingNotes: result.schedulingNotes,
            ChatGptComment: result.ChatGptComment,
            FirstQuestion: result.FirstQuestion
          };
          
          return event;
        };

        // Calculate total hours and validate
        const totalHours = result.timeBreakdown.estimatedTotalHours;
        const hoursAvailable = totalDays * hoursPerDay;

        console.log('Time calculation:', {
          totalHours,
          hoursAvailable,
          totalDays,
          hoursPerDay
        });

        if (totalHours > hoursAvailable) {
          alert(`Warning: The estimated time (${totalHours}h) exceeds the available working hours (${hoursAvailable}h) in the selected date range. Tasks will be distributed across available hours.`);
        }

        // Define task sequence with priorities
        const timeBlocks = [
          { type: 'Reading', hours: result.timeBreakdown.readingTime, color: '#912338', priority: 1, preferredTime: 'morning' },
          { type: 'Research', hours: result.timeBreakdown.researchTime, color: '#a62941', priority: 2, preferredTime: 'morning' },
          { type: 'Writing', hours: result.timeBreakdown.writingTime, color: '#bf2f4a', priority: 3, preferredTime: 'afternoon' },
          { type: 'Review', hours: result.timeBreakdown.reviewTime, color: '#d83553', priority: 4, preferredTime: 'afternoon' },
          { type: 'Buffer', hours: result.timeBreakdown.bufferTime, color: '#f13c5c', priority: 5, preferredTime: 'flexible' }
        ];

        let currentDay = startDateTime.clone().startOf('day');
        let currentDayHours = 0;

        // Sort blocks by priority
        timeBlocks.sort((a, b) => a.priority - b.priority);

        // Distribute tasks across days
        for (const block of timeBlocks) {
          let remainingHours = block.hours;
          
          while (remainingHours > 0) {
            // If we've reached the end of the working day or the maximum hours per day
            if (currentDayHours >= hoursPerDay || currentDay.hour() >= workingHoursEnd) {
              currentDay.add(1, 'day').hour(workingHoursStart).minute(0);
              currentDayHours = 0;
            }

            // Adjust start time based on preferred time of day
            if (currentDayHours === 0) {
              if (block.preferredTime === 'morning') {
                currentDay.hour(workingHoursStart);
              } else if (block.preferredTime === 'afternoon') {
                currentDay.hour(13); // Start after lunch
              }
            }

            // Calculate hours for this block
            const hoursForThisBlock = Math.min(
              remainingHours,
              hoursPerDay - currentDayHours,
              workingHoursEnd - currentDay.hour()
            );

            const event = createEvent(
              block.type,
              hoursForThisBlock,
              block.color,
              currentDay.clone()
            );

            if (event) {
              events.push(event);
              currentDay.add(hoursForThisBlock, 'hours');
              currentDayHours += hoursForThisBlock;
              remainingHours -= hoursForThisBlock;

              console.log(`Created ${block.type} event:`, {
                start: event.start,
                end: event.end,
                hours: hoursForThisBlock
              });
            }
          }
        }

        // Add all events to the calendar
        setCurrentEvents(prev => [...prev, ...events]);
        handleDialogClose();
        setIsLoading(false);
        
        return events[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error planning assignment:', error);
      alert('Failed to plan assignment. Please try again.');
      setIsLoading(false);
      return null;
    }
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Assignment Planner</h1>
        <p className="mb-4">Click on a time slot to add an assignment or click an event to edit</p>
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
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          nowIndicator={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          eventClassNames={(arg) => {
            // Extract event type from title if it exists
            const eventType = arg.event.title.toLowerCase().includes('reading') ? 'reading'
              : arg.event.title.toLowerCase().includes('research') ? 'research'
              : arg.event.title.toLowerCase().includes('writing') ? 'writing'
              : arg.event.title.toLowerCase().includes('review') ? 'review'
              : arg.event.title.toLowerCase().includes('buffer') ? 'buffer'
              : '';
            return ['calendar-event', eventType];
          }}
          eventContent={(arg) => {
            return (
              <div className="fc-event-main-content">
                <div className="fc-event-time">
                  {arg.timeText}
                </div>
                <div className="fc-event-title">
                  {arg.event.title}
                </div>
              </div>
            );
          }}
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
