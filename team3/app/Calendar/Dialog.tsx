import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Paper
} from '@mui/material';
import { zodResolver } from "@hookform/resolvers/zod";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { EventCreationFormInput } from '../types/FormTypes';
import { EventCreationFormSchema } from '../schema';
import { useForm, Controller } from "react-hook-form";
import moment from 'moment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

// Extend the interface to support editing existing events
interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
  onDelete?: (eventId: string) => void;
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onPlanForMe: (eventData: any) => Promise<any>;
  selectedEvent?: any;
}

export default function EventDialog({
  open,
  onClose,
  onSave,
  onDelete,
  onPlanForMe,
  selectedStart,
  selectedEnd,
  selectedEvent
}: EventDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [isPlanning, setIsPlanning] = React.useState(false);
  const [planResult, setPlanResult] = React.useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control
  } = useForm<EventCreationFormInput>({
    resolver: zodResolver(EventCreationFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      startDate: selectedStart ? moment(selectedStart).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
      startTime: selectedStart ? moment(selectedStart).format('HH:mm') : moment().format('HH:mm'),
      endDate: selectedEnd ? moment(selectedEnd).format('YYYY-MM-DD') : moment().add(1, 'hour').format('YYYY-MM-DD'),
      endTime: selectedEnd ? moment(selectedEnd).format('HH:mm') : moment().add(1, 'hour').format('HH:mm'),
      allDay: false
    }
  });

  // Update form values when selected dates change
  React.useEffect(() => {
    if (selectedStart) {
      setValue('startDate', moment(selectedStart).format('YYYY-MM-DD'));
      setValue('startTime', moment(selectedStart).format('HH:mm'));
    }
    if (selectedEnd) {
      setValue('endDate', moment(selectedEnd).format('YYYY-MM-DD'));
      setValue('endTime', moment(selectedEnd).format('HH:mm'));
    }
  }, [selectedStart, selectedEnd, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handlePlanForMe = async (formData: EventCreationFormInput) => {
    setIsPlanning(true);
    try {
      const result = await onPlanForMe({
        ...formData,
        file
      });
      
      if (result) {
        setPlanResult(result);
      }
    } catch (error) {
      console.error('Error planning assignment:', error);
    } finally {
      setIsPlanning(false);
    }
  };

  const onSubmit = (formData: EventCreationFormInput) => {
    // Create a new event object
    const startDateTime = moment(`${formData.startDate} ${formData.startTime}`, 'YYYY-MM-DD HH:mm');
    const endDateTime = moment(`${formData.endDate} ${formData.endTime}`, 'YYYY-MM-DD HH:mm');
    
    const newEvent = {
      id: `event-${Date.now()}-${formData.title.replace(/\s+/g, '').toLowerCase()}`,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      startStr: startDateTime.toISOString(),
      endStr: endDateTime.toISOString(),
      allDay: formData.allDay || false
    };
    
    onSave(newEvent);
  };

  const handleApplyPlan = () => {
    if (planResult) {
      onSave(planResult);
    }
  };

  const handleDelete = () => {
    if (selectedEvent && onDelete) {
      onDelete(selectedEvent.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedEvent ? 'Edit Assignment' : 'Add Assignment'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                {...register('title')}
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                {...register('description')}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                {...register('location')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Start Date"
                      value={moment(field.value)}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label="Start Time"
                      value={moment(field.value, 'HH:mm')}
                      onChange={(time) => field.onChange(time ? time.format('HH:mm') : '')}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="End Date"
                      value={moment(field.value)}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      label="End Time"
                      value={moment(field.value, 'HH:mm')}
                      onChange={(time) => field.onChange(time ? time.format('HH:mm') : '')}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                Upload Assignment File
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                />
              </Button>
              {file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {file.name}
                </Typography>
              )}
            </Grid>
          </Grid>
          
          {planResult && (
            <Paper sx={{ mt: 3, p: 2 }}>
              <Typography variant="h6">AI Planning Results</Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 1 }}>
                {planResult.ChatGptComment}
              </Typography>
              
              {planResult.timeBreakdown && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Time Breakdown:</Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2">Total Hours: {planResult.timeBreakdown.estimatedTotalHours}</Typography>
                      <Typography variant="body2">Reading: {planResult.timeBreakdown.readingTime}h</Typography>
                      <Typography variant="body2">Research: {planResult.timeBreakdown.researchTime}h</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">Writing: {planResult.timeBreakdown.writingTime}h</Typography>
                      <Typography variant="body2">Review: {planResult.timeBreakdown.reviewTime}h</Typography>
                      <Typography variant="body2">Buffer: {planResult.timeBreakdown.bufferTime}h</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {planResult.schedulingNotes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Scheduling Notes:</Typography>
                  <Typography variant="body2">Optimal Time: {planResult.schedulingNotes.optimalTimeOfDay}</Typography>
                  {planResult.schedulingNotes.recommendedBreaks.length > 0 && (
                    <Typography variant="body2">
                      Recommended Breaks: {planResult.schedulingNotes.recommendedBreaks.join(', ')}
                    </Typography>
                  )}
                </Box>
              )}

              {planResult.events && planResult.events.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Planned Schedule:</Typography>
                  <Box sx={{ mt: 1 }}>
                    {planResult.events.map((event: any, index: number) => (
                      <Box
                        key={event.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1,
                          mb: 1,
                          borderRadius: 1,
                          backgroundColor: event.backgroundColor + '20',
                          border: `1px solid ${event.backgroundColor}`
                        }}
                      >
                        <Typography sx={{ mr: 2 }}>{event.title}</Typography>
                        <Typography variant="body2" sx={{ ml: 'auto', color: 'text.secondary' }}>
                          {moment(event.start).format('MMM D, h:mm A')} - {moment(event.end).format('h:mm A')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {selectedEvent && onDelete && (
          <Button 
            onClick={handleDelete}
            color="error"
            variant="outlined"
            sx={{ mr: 'auto' }}
          >
            Delete
          </Button>
        )}
        {file && (
          <Button 
            onClick={handleSubmit(handlePlanForMe)} 
            disabled={isPlanning}
            color="secondary"
          >
            {isPlanning ? 'Planning...' : 'Plan for Me'}
          </Button>
        )}
        {planResult ? (
          <Button onClick={handleApplyPlan} color="primary">
            Apply Plan
          </Button>
        ) : (
          <Button onClick={handleSubmit(onSubmit)} color="primary">
            {selectedEvent ? 'Update' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
