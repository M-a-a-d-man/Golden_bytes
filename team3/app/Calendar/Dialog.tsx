import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import { zodResolver } from "@hookform/resolvers/zod";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { EventCreationFormInput } from '../types/FormTypes';
import { EventCreationFormSchema, EventObject, convertFormToEventObject } from '../schema';
import { useForm, Controller } from "react-hook-form";
import moment from 'moment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

// Extend the interface to support editing existing events
interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (eventData:EventObject) => void;
  selectedStart: Date | null;
  selectedEnd: Date | null;
  existingEvent?: EventObject;
  onPlanForMe: (eventData: EventCreationFormInput) => EventCreationFormInput | null;
}

export default function EventDialog({
  open,
  onClose,
  onSave,
  onPlanForMe,
  selectedStart,
  selectedEnd,
  existingEvent
}: EventDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);

  const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
      setError,
      control,
      reset,
      setValue
    } = useForm<EventCreationFormInput>({
      resolver: zodResolver(EventCreationFormSchema)}
    );
    // Watch date values to perform cross-field validation
  const watchStartDate = watch("startDate");
  const watchEndDate = watch("endDate");

  // Add effect for cross-field validation
  React.useEffect(() => {
    if (watchStartDate && watchEndDate && moment(watchStartDate).isBefore(moment(watchEndDate))) {
      setError("endDate", {
        type: "manual",
        message: "End date must be after start date"
      });
    }
  }, [watchStartDate, watchEndDate, setError]);
    
  React.useEffect(() => {
    if (open) {
      // Reset the form first
      reset({
        title: '',
        description: '',
        startDate: moment().format('YYYY-MM-DD'),
        startTime: moment().format('HH:mm'),
        endDate: null,
        endTime: null,
        location: '',
        recurrence: '',
        attendees: []
      });
      
      // If editing an existing event
      if (existingEvent && existingEvent.start) {
        const startMoment = moment(existingEvent.start);
        const endMoment = existingEvent.end ? moment(existingEvent.end) : null;
        
        // Set form values using setValue
        setValue('title', existingEvent.title || '');
        setValue('description', existingEvent.description || '');
        setValue('location', existingEvent.location || '');
        setValue('startDate', startMoment.format('YYYY-MM-DD'));
        setValue('startTime', startMoment.format('HH:mm'));
        
        if (endMoment) {
          setValue('endDate', endMoment.format('YYYY-MM-DD'));
          setValue('endTime', endMoment.format('HH:mm'));
        }
        
        if (existingEvent.recurrence) {
          setValue('recurrence', existingEvent.recurrence);
        }
        
        if (existingEvent.attendees) {
          setValue('attendees', existingEvent.attendees);
        }
      }
      // If creating a new event from selected dates
      else if (selectedStart) {
        const startMoment = moment(selectedStart);
        const endMoment = selectedEnd ? moment(selectedEnd) : moment(selectedStart).add(1, 'hour');
        
        setValue('startDate', startMoment.format('YYYY-MM-DD'));
        setValue('startTime', startMoment.format('HH:mm'));
        setValue('endDate', endMoment.format('YYYY-MM-DD'));
        setValue('endTime', endMoment.format('HH:mm'));
      }
    }
  }, [open, existingEvent, selectedStart, selectedEnd, reset, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // In EventDialog.tsx
  const handlePlanForMe = async (formData:EventCreationFormInput) => {
    try {
      // Call the parent component's onPlanForMe function and await its response
      const scheduledEvent = onPlanForMe(formData);

      if (scheduledEvent !== null) {
        const eventData = convertFormToEventObject(scheduledEvent);
        console.log('Saving event:', eventData);
        onSave(eventData);
      }
      else{
        throw new Error('Failed to plan event, function returned null');
      }
    } catch (error) {
      console.error('Error in AI planning:', error);
      alert('Failed to plan your event. Please try again.');
    }
  };

  const onSubmit = (formData:EventCreationFormInput) => {
    // Prepare the data to send back
    const eventData = convertFormToEventObject(formData);

    // Log the event data for debugging
    console.log('Saving event:', eventData);

    onSave(eventData);
    console.log("event saved");
    onClose();
  };


  const recurrenceOptions = [
    { value: '', label: 'No Repeat' },
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'YEARLY', label: 'Yearly' }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {existingEvent ? 'Edit Event' : 'Create New Event'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        {/* Title */}
        <TextField
          fullWidth
          label="Event Title"
          {...register('title')}
          required
          error={!!errors.title}
          helperText={errors.title ? errors.title.message : ''}
        />

        {/* Description */}
        <TextField
          fullWidth
          label="Description"
          multiline
          rows={3}
          {...register('description')}
        />

        {/* Start Date and Time */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="startDate"
            control={control}
            render={({ field, fieldState }) => (
              <DatePicker
                label="Start Date"
                value={field.value ? moment(field.value) : null}
                onChange={field.onChange}
                slotProps={{
                  textField: {
                    error: !!fieldState.error,
                    helperText: fieldState.error ? fieldState.error.message : '',
                    required: true
                  }
                }}
              />
            )}
          />
          
          <Controller
            name="startTime"
            control={control}
            render={({ field, fieldState }) => (
              <TimePicker
                label="Start Time"
                value={field.value ? moment(field.value) : null}
                onChange={(newValue) => {
                  field.onChange(newValue);
                }}
                slotProps={{
                  textField: {
                    error: !!fieldState.error,
                    helperText: fieldState.error ? fieldState.error.message : '',
                  }
                }}
              />
            )}
          />
        </div>

        {/* End Date and Time */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <Controller
            name="endDate"
            control={control}
            render={({ field, fieldState }) => (
              <DatePicker
                label="End Date"
                value={field.value ? moment(field.value) : null}
                onChange={(newValue) => {
                  field.onChange(newValue);
                }}
                slotProps={{
                  textField: {
                    error: !!fieldState.error,
                    helperText: fieldState.error ? fieldState.error.message : '',
                    required: true
                  }
                }}
              />
            )}
          />
          
          <Controller
            name="endTime"
            control={control}
            render={({ field, fieldState }) => (
              <TimePicker
                label="End Time"
                value={field.value ? moment(field.value) : null}
                onChange={(newValue) => {
                  field.onChange(newValue);
                }}
                slotProps={{
                  textField: {
                    error: !!fieldState.error,
                    helperText: fieldState.error ? fieldState.error.message : '',
                    required: true
                  }
                }}
              />
            )}
          />
        </div>

        {/* Location */}
        <TextField
          fullWidth
          label="Location"
          {...register('location')}
        />

        {/* Recurrence */}
        <FormControl fullWidth>
          <InputLabel>Recurrence</InputLabel>
          <Controller
            name="recurrence"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                label="Recurrence"
                onChange={(e) => {
                  field.onChange(e.target.value);
                }}
              >
                {recurrenceOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </FormControl>

        {/* File Upload */}
        <Button 
          fullWidth 
          variant="outlined" 
          component="label"
        >
          {file ? `${file.name} (Change)` : 'Upload Attachment'}
          <input
            type="file"
            hidden
            onChange={handleFileChange}
          />
        </Button>

        {/* Plan for me Button */}
        <Button 
          fullWidth 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit(handlePlanForMe)}
        >
          Plan for me
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleSubmit(onSubmit)}
        >
          {existingEvent ? 'Update Event' : 'Create Event'}
        </Button>
      </DialogActions>
    </Dialog>
    </LocalizationProvider>
  );
}
