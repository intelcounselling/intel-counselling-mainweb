import { google } from 'googleapis';

// Creates a Google Calendar event with a Meet link. Called only from
// send-booking-email AFTER payment is verified — never exposed as a route.
// Returns the link, or null when credentials are missing / Google fails, so a
// booking is never lost just because Meet couldn't be created.
export async function createMeetLink({ summary, description, date, time }) {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.replace(/^"|"$/g, '');
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) return null;

  try {
    const m = String(time || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return null;
    let h = parseInt(m[1], 10);
    if (m[3].toUpperCase() === 'PM' && h < 12) h += 12;
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
    // Anchor to IST — server local time may be UTC
    const start = new Date(`${date}T${String(h).padStart(2, '0')}:${m[2]}:00+05:30`);
    if (isNaN(start.getTime())) return null;
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: summary || 'Intel Counselling Session',
        description: description || 'Therapy session booking.',
        start: { dateTime: start.toISOString(), timeZone: 'Asia/Kolkata' },
        end: { dateTime: end.toISOString(), timeZone: 'Asia/Kolkata' },
        conferenceData: {
          createRequest: {
            requestId: `intel-counselling-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    });
    return response.data.hangoutLink || null;
  } catch (err) {
    console.error('Meet link creation failed:', err.message);
    return null;
  }
}
