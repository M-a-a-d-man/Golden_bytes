// pages/api/events/[userId]/[eventId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/app/auth';
import fs from 'fs';
import path from 'path';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await auth();

  // Get the userId and eventId from the URL parameters
  const { userId, eventId } = req.query;

  // Security check: Only allow access to own data or admin access
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Additional security: Ensure users can only access their own data
  if (session.user?.email?.replace(/[^a-zA-Z0-9]/g, '_') !== userId) {
    return res.status(403).json({ error: 'Forbidden: Cannot access another user\'s events' });
  }

  // Set up file paths
  const eventsDir = path.join(process.cwd(), 'data/events');
  const eventsFilePath = path.join(eventsDir, `${userId}.json`);

  // Check if events file exists
  if (!fs.existsSync(eventsFilePath)) {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return res.status(404).json({ error: 'No events found for this user' });
    }
    // For PUT, we'll create a new file with just this event
    if (req.method === 'PUT') {
      const newEvent = {
        ...req.body,
        id: eventId as string,
        createdAt: new Date().toISOString()
      };
      fs.writeFileSync(eventsFilePath, JSON.stringify([newEvent], null, 2));
      return res.status(201).json(newEvent);
    }
  }

  try {
    const events = JSON.parse(fs.readFileSync(eventsFilePath, 'utf8'));
    
    // GET - Retrieve a specific event
    if (req.method === 'GET') {
      const event = events.find((e: {id:string}) => e.id === eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      return res.status(200).json(event);
    }

    // PUT - Update a specific event
    if (req.method === 'PUT') {
      const eventIndex = events.findIndex((e: {id:string}) => e.id === eventId);
      
      if (eventIndex === -1) {
        // Event doesn't exist, create it
        const newEvent = {
          ...req.body,
          id: eventId as string,
          createdAt: new Date().toISOString()
        };
        events.push(newEvent);
        fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2));
        return res.status(201).json(newEvent);
      } else {
        // Update existing event
        events[eventIndex] = {
          ...events[eventIndex],
          ...req.body,
          id: eventId as string, // Ensure ID doesn't change
          updatedAt: new Date().toISOString()
        };
        fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2));
        return res.status(200).json(events[eventIndex]);
      }
    }

    // DELETE - Remove a specific event
    if (req.method === 'DELETE') {
      const filteredEvents = events.filter((e:  {id: string}) => e.id !== eventId);
      
      if (filteredEvents.length === events.length) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      fs.writeFileSync(eventsFilePath, JSON.stringify(filteredEvents, null, 2));
      return res.status(200).json({ message: 'Event deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error processing event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
