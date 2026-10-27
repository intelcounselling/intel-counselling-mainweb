import { escapeHtml, plainText } from '../escape.js';
import { emailLayout, p as para, panel, facts } from '../emailTheme.js';

export default async function handler(req, res) {
  // CORS headers
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

    const adminHtml = emailLayout({
      title: 'New pre-assessment registration',
      preheader: `${plainText(name)} registered for ${plainText(testTitle)}`,
      eyebrow: 'New registration',
      heading: 'A new person is taking an assessment',
      audience: 'team',
      body:
        facts([
          ['Name', `<strong>${escapeHtml(name)}</strong>`],
          ['Email', `<a href="mailto:${escapeHtml(email)}" style="color:#1C3F39;">${escapeHtml(email)}</a>`],
          ['Phone', escapeHtml(phone)],
          ['Age', escapeHtml(age)],
          ['Gender', escapeHtml(gender)],
          ['Status', escapeHtml(occupation)],
        ]) +
        panel(`<strong>Intended test</strong><br/>${escapeHtml(testTitle)}`, 'lavender') +
        panel(`<strong>Main concerns</strong><br/><div style="white-space:pre-wrap;">${reason ? escapeHtml(reason) : 'None provided'}</div>`, 'cream') +
        para(`Registered on the website: ${escapeHtml(registeredAt)}`, 'font-size:13px;color:#8a847a;'),
    });

    const payload = {
      to: [{ email: process.env.ADMIN_EMAIL || 'intelcounselling@gmail.com', name: 'Intel Counselling Admin' }],
      sender: { email: process.env.SENDER_EMAIL || 'intelcounselling@gmail.com', name: 'Intel Counselling Website' },
      replyTo: { email: email, name: name },
      subject: `New Test Registration: ${plainText(name)} (${plainText(testTitle)})`,
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
      const err = await response.json().catch(() => ({}));
      console.error('Failed to send registration email:', err);
      return res.status(500).json({ error: 'Failed to send communication' });
    }

    res.status(200).json({ success: true, message: 'Registration email sent successfully.' });
  } catch (error) {
    console.error('Error sending registration:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
