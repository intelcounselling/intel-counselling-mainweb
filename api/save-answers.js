import crypto from 'crypto';
import { encrypt } from './_encryption.js';
import { db } from './_firebase.js';
import { escapeHtml, plainText } from './_escape.js';

const getTestTitle = (testId) => {
  switch (testId) {
    case 'career': return 'Career Guidance Assessment';
    case 'phq9': return 'Depression Screening (PHQ-9)';
    case 'gad7': return 'Anxiety Screening (GAD-7)';
    case 'pss10': return 'Stress Self-Check (PSS-10)';
    case 'sleep': return 'Sleep Hygiene Check';
    default: return testId || 'Self-Assessment';
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { answers, registration, testId } = req.body;
    if (!answers || typeof answers !== 'string') {
      return res.status(400).json({ error: 'Invalid answers payload' });
    }

    const { encrypted, iv } = encrypt(answers);
    const id = crypto.randomUUID();
    
    if (db) {
      // Set to Firestore in the 'assessments' collection
      await db.collection('assessments').doc(id).set({
        encrypted,
        iv,
        createdAt: new Date()
      });
    } else {
      console.warn('Firebase DB not initialized. Skipping save.');
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Send email notification to admin asynchronously if registration details exist
    if (registration && testId) {
      const apiKey = process.env.BREVO_API_KEY;
      if (apiKey) {
        const { name, email, phone, age, gender, occupation, reason } = registration;
        const testTitle = getTestTitle(testId);
        
        const adminHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Test Completed</title>
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
              <h2 style="color: #2D6A4F; margin-top: 0;">✅ Assessment Completed</h2>
              <p style="color: #666; font-size: 14px; margin-top: -10px; margin-bottom: 25px;">A user has completed a free assessment test on the website.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 25px;" />
              
              <div class="field">
                <div class="label">Client Name</div>
                <div class="val"><strong>${escapeHtml(name || 'Anonymous')}</strong></div>
              </div>

              <div class="field">
                <div class="label">Email & Phone</div>
                <div class="val">${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : 'N/A'} | ${phone ? escapeHtml(phone) : 'N/A'}</div>
              </div>

              <div class="field" style="display: flex; gap: 40px;">
                <div>
                  <div class="label">Age</div>
                  <div class="val">${age ? escapeHtml(age) : 'N/A'}</div>
                </div>
                <div>
                  <div class="label">Gender</div>
                  <div class="val">${gender ? escapeHtml(gender) : 'N/A'}</div>
                </div>
                <div>
                  <div class="label">Status</div>
                  <div class="val">${occupation ? escapeHtml(occupation) : 'N/A'}</div>
                </div>
              </div>

              <div class="field" style="background: #f4faf6; padding: 12px; border-radius: 6px; border: 1px solid #e1ede5;">
                <div class="label" style="color: #2D6A4F;">Completed Test</div>
                <div class="val highlight">${escapeHtml(testTitle)}</div>
              </div>
              
              <div class="field">
                <div class="label">Primary Concerns / Reason for Assessment</div>
                <div class="message-box">${reason ? escapeHtml(reason) : 'None provided'}</div>
              </div>

              <div style="font-size: 11px; color: #aaa; margin-top: 30px;">
                Completed via Website: ${new Date().toLocaleString()}
              </div>
            </div>
          </body>
          </html>
        `;

        const payload = {
          to: [{ email: 'intelcounselling@gmail.com', name: 'Intel Counselling Admin' }],
          sender: { email: 'intelcounselling@gmail.com', name: 'Intel Counselling Website' },
          replyTo: email ? { email, name } : undefined,
          subject: `Test Completed: ${plainText(name || 'User')} took ${plainText(testTitle)}`,
          htmlContent: adminHtml
        };

        fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': apiKey
          },
          body: JSON.stringify(payload)
        }).catch(err => {
          console.error('Failed to dispatch test completion email:', err);
        });
      } else {
        console.warn('BREVO_API_KEY not set. Skipping completion email.');
      }
    }

    res.status(200).json({ id });
  } catch (error) {
    console.error('Error saving answers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
