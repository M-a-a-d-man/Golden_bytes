import { z } from "zod";
import moment from "moment";

export const LoginFormSchema = z.object({
    email: z.string().nonempty("Email is required").email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
  });
  
  // The form schema used for event creation/editing
  export const EventCreationFormSchema = z.object({
    title: z.string().nonempty("Title is required").describe("The text that will appear on an event"),
    description: z.string().optional().describe("Description of the event"),
    location: z.string().optional().describe("Location where the event takes place"),
    
    // For date strings in YYYY-MM-DD format
    startDate: z.string()
      .nonempty("Start date is required")
      .refine(
        (val) => moment(val, "YYYY-MM-DD", true).isValid(),
        { message: "Invalid start date format" }
      )
      .default(moment().format("YYYY-MM-DD"))
      .describe("The start date of the event"),
    
    // For time strings in HH:MM format
    startTime: z.string()
      .nonempty("Start time is required")
      .refine(
        (val) => moment(val, "HH:mm", true).isValid(),
        { message: "Invalid start time format" }
      )
      .default(moment().format("HH:mm"))
      .describe("The start time of the event"),
    
    endDate: z.string()
      .optional()
      .nullable()
      .refine(
        (val) => moment(val, "YYYY-MM-DD", true).isValid(),
        { message: "Invalid end date format" }
      )
      .default(null)
      .describe("The end date of the event"),
    
    endTime: z.string()
      .optional()
      .nullable()
      .refine(
        (val) => moment(val, "HH:mm", true).isValid(),
        { message: "Invalid end time format" }
      )
      .default(null)
      .describe("The end time of the event"),
    
    recurrence: z.string().optional().describe("Recurrence pattern for the event"),
    attendees: z.array(z.string()).optional().default([]).describe("List of attendees for the event"),
    file: z.any().optional().describe("Attached file for the event"),
    id: z.string().optional().describe("A unique identifier of an event"),
    allDay: z.boolean().optional().default(false).describe("Determines if the event is shown in the all-day section")
  }).refine(
    (data) => {
      const start = moment(`${data.startDate} ${data.startTime}`, "YYYY-MM-DD HH:mm");
      const end = moment(`${data.endDate} ${data.endTime}`, "YYYY-MM-DD HH:mm");
      return end.isAfter(start);
    },
    {
      message: "End time must be after start time",
      path: ["endTime"]
    }
  );
  
  // The full event object schema for FullCalendar integration
  export const EventObjectSchema = z.object({
    id: z.string().optional().describe("A unique identifier of an event"),
    title: z.string().nonempty().describe("The text that will appear on an event"),
    
    // Core date properties
    start: z.date().describe("Date object that obeys the current timeZone. When an event begins"),
    end: z.date().nullable().describe("Date object that obeys the current timeZone. When an event ends"),
    startStr: z.string().describe("ISO8601 string representation of the start date"),
    endStr: z.string().describe("ISO8601 string representation of the end date"),
    allDay: z.boolean().describe("Determines if the event is shown in the all-day section"),
    
    // Optional properties from form data
    description: z.string().optional().describe("Description of the event"),
    location: z.string().optional().describe("Location where the event takes place"),
    attendees: z.array(z.string()).optional().describe("List of attendees for the event"),
    recurrence: z.string().optional().describe("Recurrence pattern for the event"),
    
    // FullCalendar specific properties
    groupId: z.string().optional().describe("Events that share a groupId will be dragged and resized together"),
    url: z.string().optional().describe("A URL that will be visited when this event is clicked"),
    classNames: z.array(z.string()).optional().describe("HTML classNames to be attached to the rendered event"),
    editable: z.boolean().nullable().optional().describe("Override for the editable setting for this event"),
    startEditable: z.boolean().nullable().optional().describe("Override for eventStartEditable setting"),
    durationEditable: z.boolean().nullable().optional().describe("Override for eventDurationEditable setting"),
    resourceEditable: z.boolean().nullable().optional().describe("Override for eventResourceEditable setting"),
    display: z.enum(['auto', 'block', 'list-item', 'background', 'inverse-background', 'none'])
      .optional()
      .describe("The rendering type of this event"),
    overlap: z.boolean().optional().describe("Override for eventOverlap setting"),
    constraint: z.any().optional().describe("The eventConstraint override for this event"),
    backgroundColor: z.string().optional().describe("Override for eventBackgroundColor"),
    borderColor: z.string().optional().describe("Override for eventBorderColor"),
    textColor: z.string().optional().describe("Override for eventTextColor"),
    extendedProps: z.record(z.any()).optional().describe("Miscellaneous other properties"),
    source: z.any().nullable().optional().describe("Reference to the Event Source")
  });
  
  // Type definitions
  export type EventCreationFormInput = z.infer<typeof EventCreationFormSchema>;
  export type EventObject = z.infer<typeof EventObjectSchema>;
  
  // Helper function to convert form data to EventObject
  export const convertFormToEventObject = (formData: EventCreationFormInput): EventObject => {
    const start = moment(`${formData.startDate} ${formData.startTime}`, "YYYY-MM-DD HH:mm").toDate();
    const end = moment(`${formData.endDate} ${formData.endTime}`, "YYYY-MM-DD HH:mm").toDate();
    
    return {
      title: formData.title,
      start,
      end,
      startStr: start.toISOString(),
      endStr: end.toISOString(),
      allDay: formData.allDay || !formData.startDate ? true : false,
      description: formData.description,
      location: formData.location,
      attendees: formData.attendees,
      recurrence: formData.recurrence,
      extendedProps: {
        description: formData.description,
        location: formData.location,
        attendees: formData.attendees,
        file: formData.file
      }
    };
  };
  