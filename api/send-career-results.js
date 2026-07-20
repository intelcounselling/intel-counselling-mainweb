export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { registration, appointment, result } = req.body;

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'BREVO_API_KEY is not set' });
    }

    const { name, email, phone, age, gender } = registration || {};
    const { sessionMode, date, time } = appointment || {};
    const { mi, interests, personality, summary } = result || {};

    const formatMi = mi ? Object.entries(mi).map(([k, v]) => `<li><strong>${k}:</strong> ${Math.round((v / 20) * 100)}%</li>`).join('') : '';
    const formatInterests = interests ? Object.entries(interests).map(([k, v]) => `<li><strong>${k}:</strong> ${Math.round((v / 40) * 100)}%</li>`).join('') : '';
    const formatPersonality = personality ? Object.entries(personality).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('') : '';

    const adminHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Career Assessment Results & Appointment</title>
        <style>
          body { font-family: 'Arial', sans-serif; background: #f9f9f9; padding: 20px; }
          .container { background: #fff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
          .section { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
          .section:last-child { border-bottom: none; }
          .title { font-size: 18px; color: #1C3F39; font-weight: bold; margin-bottom: 15px; }
          .field { margin-bottom: 12px; }
          .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; font-weight: bold; }
          .val { font-size: 14px; color: #333; }
          ul { padding-left: 20px; margin: 5px 0; font-size: 14px; color: #333; }
          li { margin-bottom: 5px; }
          .highlight { font-weight: bold; color: #C19B6C; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="color: #1C3F39; margin-top: 0;">🎓 Career Assessment Results & Booking</h2>
          <p style="color: #666; font-size: 14px; margin-top: -10px; margin-bottom: 25px;">A new career guidance assessment has been completed.</p>
          
          <div class="section">
            <div class="title">👤 User Details</div>
            <div class="field">
              <div class="label">Name</div>
              <div class="val"><strong>${name || 'N/A'}</strong></div>
            </div>
            <div class="field">
              <div class="label">Email & Phone</div>
              <div class="val"><a href="mailto:${email}">${email || 'N/A'}</a> | ${phone || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Age & Gender</div>
              <div class="val">${age || 'N/A'} | ${gender || 'N/A'}</div>
            </div>
          </div>

          <div class="section" style="background: #fdfaf4; padding: 15px; border-radius: 6px; border: 1px solid #ede8e0;">
            <div class="title" style="color: #C19B6C; margin-bottom: 10px;">📅 Scheduled Appointment Details</div>
            <div class="field">
              <div class="label">Format</div>
              <div class="val"><strong>${sessionMode === 'online' ? '🌐 Online (Virtual)' : '🏢 In-Person'}</strong></div>
            </div>
            <div class="field">
              <div class="label">Date & Time Slot</div>
              <div class="val highlight">${date || 'N/A'} at ${time || 'N/A'}</div>
            </div>
          </div>

          <div class="section">
            <div class="title">🧠 Test Scores Summary</div>
            <div class="field">
              <div class="label">Top Intelligence Profile</div>
              <div class="val">${summary?.topIntelligence?.join(', ') || 'N/A'}</div>
            </div>
            <div class="field">
              <div class="label">Top Vocational Interests</div>
              <div class="val">${summary?.topInterests?.join(', ') || 'N/A'}</div>
            </div>
          </div>

          <div class="section">
            <div class="title">📊 Detailed Intelligence Scores</div>
            <ul>
              ${formatMi}
            </ul>
          </div>

          <div class="section">
            <div class="title">🎯 Detailed Vocational Interests</div>
            <ul>
              ${formatInterests}
            </ul>
          </div>

          <div class="section">
            <div class="title">💼 Career Personality Profile</div>
            <ul>
              ${formatPersonality}
            </ul>
          </div>

          <div style="font-size: 11px; color: #aaa; margin-top: 30px; text-align: center;">
            Sent automatically by Intel Counselling Portal
          </div>
        </div>
      </body>
      </html>
    `;

    const payload = {
      to: [{ email: 'intelcounselling@gmail.com', name: 'Intel Counselling Admin' }],
      sender: { email: 'intelcounselling@gmail.com', name: 'Intel Counselling Assessment Portal' },
      replyTo: { email: email, name: name },
      subject: `Career Test Completed: ${name} (${date} @ ${time})`,
      htmlContent: adminHtml
    };

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Failed to send career result email:', err);
      return res.status(500).json({ error: 'Failed to send results email' });
    }

    res.status(200).json({ success: true, message: 'Career result email sent successfully.' });
  } catch (error) {
    console.error('Error sending career results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
