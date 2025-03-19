"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { DateSelectArg, EventClickArg } from '@fullcalendar/core'
import EventDialog from './Dialog';
import momentPlugin from '@fullcalendar/moment';


// Type for our stored event
interface StoredEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  allDay?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function CalendarComponent() {
  const { data: session } = useSession();
  const [currentEvents, setCurrentEvents] = useState<StoredEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  
  interface EditingEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    description?: string;
    location?: string;
  }
  
  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef<FullCalendar>(null);

  // Fetch events from our API
  useEffect(() => {
    async function fetchEvents() {
      if (!session?.user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userId = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
        const response = await fetch(`/api/events/${userId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }

        const events = await response.json();
        setCurrentEvents(events);
      } catch (error) {
        console.error('Error fetching events:', error);
        alert('Failed to fetch events. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user?.email) {
      fetchEvents();
    }
  }, [session?.user?.email]);

  // Create a new event
  async function createEvent(eventData: {
    title: string;
    description?: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    location?: string;
    attendees?: string[];
    recurrence?: string;
  }) {
    if (!session?.user?.email) {
      console.error('No user email available');
      return null;
    }

    try {
      // Format dates for storage
      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}:00`);
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}:00`);

      const newEvent = {
        id: Date.now().toString(),
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        allDay: false
      };

      const userId = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
      const response = await fetch(`/api/events/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEvent)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create event: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Update an existing event
  async function updateEvent(eventData: {
    eventId?: string;
    title: string;
    description?: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    location?: string;
    attendees?: string[];
    recurrence?: string;
  }) {
    if (!session?.user?.email || !eventData.eventId) {
      console.error('No user email or event ID available');
      return null;
    }

    try {
      // Format dates for storage
      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}:00`);
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}:00`);

      const updatedEvent = {
        id: eventData.eventId,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        allDay: false
      };

      const userId = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
      const response = await fetch(`/api/events/${userId}/${eventData.eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedEvent)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update event: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      return null;
    }
  }

  // Delete event
  async function deleteEvent(eventId: string) {
    if (!session?.user?.email) {
      console.error('No user email available');
      return false;
    }

    try {
      const userId = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
      const response = await fetch(`/api/events/${userId}/${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete event: ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
      return false;
    }
  }

  function handleDateSelect(selectInfo: DateSelectArg) {
    setSelectedStart(selectInfo.start);
    setSelectedEnd(selectInfo.end);
    setEditingEvent(null);
    setIsDialogOpen(true); 
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event;
    const current_date = new Date();
    setEditingEvent({
      id: event.id,
      title: event.title,
      start: event.start || current_date,
      end: event.end || current_date,
      description: event.extendedProps?.description,
      location: event.extendedProps?.location
    });
    setIsDialogOpen(true);
  }

  function handleDialogClose() {
    setIsDialogOpen(false);
    setSelectedStart(null);
    setSelectedEnd(null);
    setEditingEvent(null);
  }

  async function handleDialogSave(eventData: {
    title: string;
    description?: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    location?: string;
    attendees?: string[];
    file?: File | null;
    eventId?: string;
    recurrence?: string;
  }) {
    try {
      console.log('Saving event data:', eventData);
      
      let result;
      const calendarApi = calendarRef.current?.getApi();

      // Validate start and end times
      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}:00`);
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}:00`);

      if (startDateTime >= endDateTime) {
        alert('End time must be after start time');
        return;
      }

      // If file is provided and "Plan for me" is requested
      if (eventData) {
        // Create FormData for the planning API
        const formData = new FormData();
        Object.entries(eventData).forEach(([key, value]) => {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } 
          else if(typeof value === 'number') {
              formData.append(key, (value as number).toString());
          }
          else if (typeof value === 'string' || value instanceof File) {
            formData.append(key, value);
          }        
        });
        // formData.append('title', eventData.title);
        // if 
        // formData.append('file', eventData.file);
        
        
        if (eventData.eventId) {
          // Update existing event
          result = await updateEvent(eventData);
        } else {
          // Create new event
          result = await createEvent(eventData);
        }

        if (result) {
          console.log('Event added/updated in calendar');
          
          // Remove existing event if updating
          if (eventData.eventId) {
            const existingEvent = calendarApi?.getEventById(eventData.eventId);
            if (existingEvent) {
              existingEvent.remove();
            }
          }
        
        // Add new/updated event to calendar
          calendarApi?.addEvent({
            id: result.id,
            title: result.title,
            start: result.start,
            end: result.end,
            extendedProps: {
              description: result.description,
              location: result.location
            }
          });
        
        // Refresh events from server
          const userId = session?.user?.email?.replace(/[^a-zA-Z0-9]/g, '_');
          const response = await fetch(`/api/events/${userId}`);
          if (response.ok) {
            const updatedEvents = await response.json();
            setCurrentEvents(updatedEvents);
          }
        }
        else {
          console.error('Failed to save event');
          alert('Failed to save event. Please try again.');
        }
      }
    } 
    catch (error) {
        console.error('Error saving event:', error);
        alert('Failed to save event. Please try again.');
    }

    handleDialogClose();
    
  }

  async function handlePlanForMe(eventData: {
    title: string;
    description?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    location?: string;
    file: File | null;
  }) {
    if (!eventData.file) {
      alert('Please upload a file to use the "Plan for me" feature');
      return null;
    }
  
    try {
      // Show loading state
      // You might want to add a loading state to your dialog component
      
      // Create FormData for the planning API
      const formData = new FormData();
      formData.append('title', eventData.title);
      formData.append('file', eventData.file);
      
      // Add any other relevant form data
      if (eventData.description) formData.append('description', eventData.description);
      if (eventData.location) formData.append('location', eventData.location);
      
      // Send request to the planning endpoint
      const response = await fetch('/api/plan-for-me', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to plan event: ${errorText}`);
      }
  
      const result = await response.json();
      
      // Parse the response
      let scheduledEvent;
      try {
        // The response might be a string that needs to be parsed
        const messageContent = typeof result.message === 'string' 
          ? JSON.parse(result.message) 
          : result.message;
        
        // Extract start and end times
        const startDateTime = new Date(messageContent.start);
        const endDateTime = new Date(messageContent.end);
        
        // Format dates for the form
        const startDate = startDateTime.toISOString().split('T')[0];
        const startTime = startDateTime.toISOString().split('T')[1].substring(0, 5);
        const endDate = endDateTime.toISOString().split('T')[0];
        const endTime = endDateTime.toISOString().split('T')[1].substring(0, 5);
        
        scheduledEvent = {
          title: eventData.title,
          description: eventData.description,
          startDate,
          startTime,
          endDate,
          endTime,
        };
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        throw new Error('Failed to parse AI scheduling response');
      }
      
      return scheduledEvent;
    } catch (error) {
      console.error('Error planning event:', error);
      alert('Failed to plan event. Please try again.');
      return null;
    }
  }
  

  // If no session, show login prompt
  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Please sign in to view your calendar</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className='demo-app'>
      <div className='demo-app-main'>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, momentPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView='dayGridMonth'
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          events={currentEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
        />
      </div>


      <EventDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
        selectedStart={selectedStart}
        selectedEnd={selectedEnd}
        existingEvent={editingEvent}
        onPlanForMe={handlePlanForMe}
        
      />
    </div>
  )
}
