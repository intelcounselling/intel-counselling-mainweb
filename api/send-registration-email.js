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
    const { name, email, phone, age, gender, occupation, reason, testTitle, registeredAt } = req.body;

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'BREVO_API_KEY is not set' });
    }

    const adminHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>New Pre-Assessment Registration</title>
        <style>
          body { font-family: 'Arial', sans-serif; background: #f9f9f9; padding: 20px; }
          .container { background: #fff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
          .field { margin-bottom: 20px; }
          .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: bold; }
          .val { font-size: 16px; color: #333; }
          .message-box { background: #f5f5f5; padding: 15px; border-radius: 6px; font-size: 15px; color: #444; line-height: 1.6; white-space: pre-wrap; }
          .highlight { font-weight: bold; color: #1C3F39; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="color: #C19B6C; margin-top: 0;">📋 New Pre-Assessment Registration</h2>
          <p style="color: #666; font-size: 14px; margin-top: -10px; margin-bottom: 25px;">A user has registered to take a free assessment test.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 25px;" />
          
          <div class="field">
            <div class="label">Client Name</div>
            <div class="val"><strong>${name}</strong></div>
          </div>

          <div class="field">
            <div class="label">Email & Phone</div>
            <div class="val"><a href="mailto:${email}">${email}</a> | ${phone}</div>
          </div>

          <div class="field" style="display: flex; gap: 40px;">
            <div>
              <div class="label">Age</div>
              <div class="val">${age}</div>
            </div>
            <div>
              <div class="label">Gender</div>
              <div class="val">${gender}</div>
            </div>
            <div>
              <div class="label">Status</div>
              <div class="val">${occupation}</div>
            </div>
          </div>

          <div class="field" style="background: #fdfaf4; padding: 12px; border-radius: 6px; border: 1px solid #ede8e0;">
            <div class="label" style="color: #C19B6C;">Intended Test</div>
            <div class="val highlight">${testTitle}</div>
          </div>
          
          <div class="field">
            <div class="label">Primary Concerns / Reason for Assessment</div>
            <div class="message-box">${reason || 'None provided'}</div>
          </div>

          <div style="font-size: 11px; color: #aaa; margin-top: 30px;">
            Registered via Website: ${registeredAt}
          </div>
        </div>
      </body>
      </html>
    `;

    const payload = {
      to: [{ email: 'intelcounselling@gmail.com', name: 'Intel Counselling Admin' }],
      sender: { email: 'intelcounselling@gmail.com', name: 'Intel Counselling Website' },
      replyTo: { email: email, name: name },
      subject: `New Test Registration: ${name} (${testTitle})`,
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
      console.error('Failed to send registration email:', err);
      return res.status(500).json({ error: 'Failed to send communication' });
    }

    res.status(200).json({ success: true, message: 'Registration email sent successfully.' });
  } catch (error) {
    console.error('Error sending registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
