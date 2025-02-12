export interface GoogleCalendarEvent {
    id: string;
    summary: string;
    description?: string;
    location?: string;
    status: 'confirmed' | 'tentative' | 'cancelled';
    htmlLink: string;
    created: string;
    updated: string;
    
    start: {
      date?: string;
      dateTime?: string;
      timeZone?: string;
    };
    end: {
      date?: string;
      dateTime?: string;
      timeZone?: string;
    };
    recurrence?: string[];
    recurringEventId?: string;
    originalStartTime?: {
      date?: string;
      dateTime?: string;
      timeZone?: string;
    };
  
    organizer?: {
      id?: string;
      email: string;
      displayName?: string;
      self?: boolean;
    };
    creator?: {
      id?: string;
      email: string;
      displayName?: string;
      self?: boolean;
    };
    attendees?: Array<{
      id?: string;
      email: string;
      displayName?: string;
      optional?: boolean;
      organizer?: boolean;
      self?: boolean;
      responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    }>;
  
    visibility?: 'default' | 'public' | 'private';
    transparency?: 'opaque' | 'transparent';
    iCalUID?: string;
    sequence?: number;
    eventType?: 'default' | 'outOfOffice' | 'focusTime';
    
    reminders?: {
      useDefault: boolean;
      overrides?: Array<{
        method: 'email' | 'popup';
        minutes: number;
      }>;
    };
  
    conferenceData?: {
      createRequest?: {
        requestId: string;
        status: {
          statusCode: string;
        };
      };
      entryPoints?: Array<{
        entryPointType: 'video' | 'phone' | 'sip' | 'more';
        uri?: string;
        label?: string;
        pin?: string;
        accessCode?: string;
        meetingCode?: string;
        passcode?: string;
        password?: string;
      }>;
    };
  }
  
  export interface GoogleCalendarResponse {
    kind: string;
    etag: string;
    summary: string;
    updated: string;
    timeZone: string;
    accessRole: string;
    defaultReminders: Array<{
      method: string;
      minutes: number;
    }>;
    items: GoogleCalendarEvent[];
  }