import { google } from 'googleapis';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { summary, description, date, time } = req.body;

    // Need to handle both explicit \n strings and actual newlines, and strip surrounding quotes if copied locally
    let rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    rawKey = rawKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

    const credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL?.replace(/^"|"$/g, ''),
      private_key: rawKey,
    };

    if (!credentials.client_email || !credentials.private_key) {
      return res.status(500).json({ error: 'Google Calendar credentials are not configured.' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Parse date and time to construct Date objects
    // Assuming date is YYYY-MM-DD and time is like "09:00 AM"
    let startDateTime = new Date();
    let endDateTime = new Date();
    
    if (date && time) {
      const timeParts = time.match(/(\d+):(\d+)\s+(AM|PM)/);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const mins = parseInt(timeParts[2]);
        const ampm = timeParts[3];
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        startDateTime = new Date(`${date}T${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`);
        endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration
      }
    } else {
        // Fallback times if date/time are malformed or missing
        startDateTime = new Date();
        startDateTime.setHours(startDateTime.getHours() + 1);
        endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
    }

    const event = {
      summary: summary || 'Intel Counselling Session',
      description: description || 'Therapy session booking.',
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Asia/Kolkata', // Set appropriate timezone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      conferenceData: {
        createRequest: {
          requestId: `intel-counselling-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary', // Must be the email of the shared calendar
      conferenceDataVersion: 1,
      requestBody: event,
    });

    const hangoutLink = response.data.hangoutLink;

    if (!hangoutLink) {
        return res.status(500).json({ error: 'Failed to generate Google Meet link' });
    }

    return res.status(200).json({ meetLink: hangoutLink, eventId: response.data.id });

  } catch (error) {
    console.error('Error generating Meet link:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
