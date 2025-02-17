"use client"

import dayGridPlugin from '@fullcalendar/daygrid';
// import timeGridPlugin from '@fullcalendar/timegrid';
// import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';

export default function Calendar() {
    return (
      <FullCalendar
        plugins={[ dayGridPlugin ]}
        initialView="dayGridMonth"
        events={[
            { title: 'event 1', date: '2025-02-01' },
            { title: 'event 2', date: '2025-02-03' }
          ]}
      />
    )
  }
  
  