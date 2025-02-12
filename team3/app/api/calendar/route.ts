import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { NextResponse } from "next/server"
import { GoogleCalendarResponse, GoogleCalendarEvent } from '@/types/google-calendar';

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const response = await fetch(
      `${process.env.GOOGLE_CALENDAR_API_URL}?` + new URLSearchParams({
        timeMin: new Date().toISOString(),
        maxResults: '50',
        singleEvents: 'true',
        orderBy: 'startTime',
        fields: 'items(id,summary,description,start,end,status,organizer,location)', // Specify desired fields

      }),
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events')
    }

    const data: GoogleCalendarResponse = await response.json();
    return NextResponse.json({ events: data.items })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}