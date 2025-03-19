// pages/api/events/[userId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/app/auth';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await auth();

  // Get the userId from the URL parameter
  const { userId } = req.query;

  // Security check: Only allow access to own data or admin access
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Additional security: Ensure users can only access their own data
  // Admin check could be added here if needed
  if (session.user?.email?.replace(/[^a-zA-Z0-9]/g, '_') !== userId) {
    return res.status(403).json({ error: 'Forbidden: Cannot access another user\'s events' });
  }

  // Set up file paths
  const eventsDir = path.join(process.cwd(), 'data/events');
  if (!fs.existsSync(eventsDir)) {
    fs.mkdirSync(eventsDir, { recursive: true });
  }

  const eventsFilePath = path.join(eventsDir, `${userId}.json`);

  // GET - Retrieve all events for the user
  if (req.method === 'GET') {
    if (!fs.existsSync(eventsFilePath)) {
      return res.status(200).json([]);
    }
    
    try {
      const events = JSON.parse(fs.readFileSync(eventsFilePath, 'utf8'));
      return res.status(200).json(events);
    } catch (error) {
      console.error('Error reading events file:', error);
      return res.status(500).json({ error: 'Failed to read events data' });
    }
  }

  // POST - Create a new event
  if (req.method === 'POST') {
    try {
      const events = fs.existsSync(eventsFilePath) 
        ? JSON.parse(fs.readFileSync(eventsFilePath, 'utf8')) 
        : [];
      
      const newEvent = {
        ...req.body,
        id: req.body.id || Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      events.push(newEvent);
      fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2));
      
      return res.status(201).json(newEvent);
    } catch (error) {
      console.error('Error saving event:', error);
      return res.status(500).json({ error: 'Failed to save event' });
    }
  }

  // PUT - Update all events (replace entire collection)
  if (req.method === 'PUT') {
    try {
      const events = req.body;
      
      if (!Array.isArray(events)) {
        return res.status(400).json({ error: 'Events must be an array' });
      }
      
      // Add timestamps to events without them
      const updatedEvents = events.map(event => ({
        ...event,
        updatedAt: new Date().toISOString()
      }));
      
      fs.writeFileSync(eventsFilePath, JSON.stringify(updatedEvents, null, 2));
      
      return res.status(200).json(updatedEvents);
    } catch (error) {
      console.error('Error updating events:', error);
      return res.status(500).json({ error: 'Failed to update events' });
    }
  }

  // DELETE - Remove all events for the user
//   if (req.method === 'DELETE') {
//     try {
//       if (fs.existsSync(eventsFilePath)) {
//         fs.unlinkSync(eventsFilePath);
//       }
//       return res.status(200).json({ message: 'All events deleted successfully' });
//     } catch (error) {
//       console.error('Error deleting events:', error);
//       return res.status(500).json({ error: 'Failed to delete events' });
//     }
//   }

  return res.status(405).json({ error: 'Method not allowed' });
}
