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

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, service, message } = req.body;

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof message !== 'string' || !message.trim() || message.length > 5000
    ) {
      return res.status(400).json({ error: 'Please provide your name, a valid email and a message.' });
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'BREVO_API_KEY is not set' });
    }

    const adminHtml = emailLayout({
      title: 'New website inquiry',
      preheader: `${plainText(name)} asked about ${plainText(service)}`,
      eyebrow: 'New inquiry',
      heading: 'Someone said hello',
      audience: 'team',
      body:
        facts([
          ['From', `<strong>${escapeHtml(name)}</strong>`],
          ['Email', `<a href="mailto:${escapeHtml(email)}" style="color:#1C3F39;">${escapeHtml(email)}</a>`],
          ['Interested in', escapeHtml(service)],
        ]) +
        panel(`<div style="white-space:pre-wrap;">${escapeHtml(message)}</div>`, 'cream') +
        para('Reply to this email to answer them directly.', 'font-size:13px;color:#8a847a;'),
    });

    const payload = {
      to: [{ email: process.env.ADMIN_EMAIL || 'intelcounselling@gmail.com', name: 'Intel Counselling Admin' }],
      sender: { email: process.env.SENDER_EMAIL || 'intelcounselling@gmail.com', name: 'Intel Counselling Website' },
      replyTo: { email: email, name: name },
      subject: `New Inquiry via Website: ${plainText(service)}`,
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
      console.error('Failed to send inquiry email:', err);
      return res.status(500).json({ error: 'Failed to send communication' });
    }

    res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error sending inquiry:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
