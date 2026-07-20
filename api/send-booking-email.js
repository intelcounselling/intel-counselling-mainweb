import PDFDocument from 'pdfkit';

function createPdfBufferBase64(details) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData.toString('base64'));
      });

      doc.fontSize(20).text('Customer Intake Form', { align: 'center' });
      doc.moveDown(2);

      const addField = (label, value) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.font('Helvetica').text(value ? value.toString() : 'N/A');
        doc.moveDown(0.5);
      };

      if (details) {
        doc.fontSize(16).font('Helvetica-Bold').text('Basic Details');
        doc.moveDown(0.5);
        addField('Full Name', details.name);
        addField('Email', details.email);
        addField('Phone', details.phone);
        addField('Age', details.age);
        addField('Gender', details.gender);
        
        doc.moveDown();
        doc.fontSize(16).font('Helvetica-Bold').text('Concerns & Expectations');
        doc.moveDown(0.5);
        addField('Main Concerns', details.mainConcerns?.join(', '));
        addField('Expectations', details.expectations?.join(', '));
        
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').text('Brief Details:');
        doc.font('Helvetica').fontSize(11).text(details.briefDetails || 'None provided');
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text('Current State');
        doc.moveDown(0.5);
        addField('Stress Level', details.currentState?.stress);
        addField('Sleep Quality', details.currentState?.sleep);
        addField('Focus Ability', details.currentState?.focus);
        
        doc.moveDown();
        doc.fontSize(14).font('Helvetica-Bold').text('Risk Check');
        doc.moveDown(0.5);
        addField('Thoughts of self-harm', details.riskCheck);
        
        doc.moveDown();
        addField('Consent Granted', details.consent ? 'Yes' : 'No');
        addField('Preferred Date', details.date);
        addField('Preferred Time', details.time);
        addField('Session Format', details.sessionMode);
      } else {
        doc.fontSize(12).text('No detailed questionnaire data provided.');
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      toName,
      customerEmail,
      serviceName,
      appointmentDate,
      appointmentTime,
      sessionMode,
      meetLink,
      rescheduleInfo,
      fullDetails,
      assessmentUrl
    } = req.body;

    const details = fullDetails || {};

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'BREVO_API_KEY is not set' });
    }

    const isOnline = sessionMode && sessionMode.toLowerCase().includes('online');
    const sessionBadge = isOnline ? '🌐 Online (Virtual)' : '🏢 In-Person';
    const rescheduleText = rescheduleInfo || 'To reschedule, please reply to this email at least 24 hours in advance.';

    // ── Customer HTML (Simplified Thank You) ──────────────────────────────────
    const customerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Thank You – Intel Counselling</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body { margin: 0; padding: 0; background: #f4f1eb; font-family: 'Inter', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #1F1E1B; padding: 40px 48px; text-align: center; }
    .header h1 { margin: 0; color: #F4EFE6; font-size: 20px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
    .body { padding: 48px; text-align: center; }
    .greeting { font-size: 22px; color: #1F1E1B; font-weight: 600; margin-bottom: 16px; }
    .message { font-size: 16px; color: #444; line-height: 1.8; margin-bottom: 32px; }
    .footer { background: #f9f7f2; padding: 24px 48px; text-align: center; border-top: 1px solid #eee; }
    .footer p { margin: 4px 0; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Intel Counselling</h1>
    </div>
    <div class="body">
      <div class="greeting">Thank You, ${toName}.</div>
      <p class="message">
        We have received your booking request and payment. Thank you for choosing <strong>Intel Counselling</strong> as your partner in healing.<br/><br/>
        Our team is reviewing your intake details now. <strong>We will contact you shortly</strong> to finalize your session and provide any necessary details.
      </p>
    </div>
    <div class="footer">
      <p>Healing Begins with Understanding.</p>
      <p>&copy; ${new Date().getFullYear()} Intel Counselling &bull; intelcounselling@gmail.com</p>
    </div>
  </div>
</body>
</html>`;

    // ── Admin HTML (Focus on Logistics & Intake) ───────────────────────────────
    const adminHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>New Booking – Intel Counselling</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
    body { margin: 0; padding: 0; background: #f0f0f0; font-family: 'Inter', sans-serif; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 10px; overflow: hidden; }
    .header { background: #1F1E1B; padding: 24px 36px; }
    .header h1 { margin: 0; color: #F4EFE6; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; }
    .body { padding: 36px; }
    .summary-card { background: #f8f6f2; border: 1px solid #e8ddd0; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ede8e0; font-size: 14px; }
    .row:last-child { border-bottom: none; }
    .lbl { color: #888; font-weight: 500; }
    .val { color: #1F1E1B; font-weight: 600; text-align: right; }
    .highlight { color: #1C3F39; font-weight: 700; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🔔 New Session Booking</h1>
    </div>
    <div class="body">
      <div style="font-size: 18px; font-weight: 600; margin-bottom: 20px;">Patient: ${toName}</div>
      
      <div class="summary-card">
        <div class="row">
          <span class="lbl">Timing</span>
          <span class="val highlight">${appointmentDate} at ${appointmentTime}</span>
        </div>
        <div class="row">
          <span class="lbl">Mode</span>
          <span class="val">${sessionBadge}</span>
        </div>
        <div class="row">
          <span class="lbl">Reason (Concerns)</span>
          <span class="val">${details.mainConcerns?.join(', ') || 'General'}</span>
        </div>
        ${assessmentUrl ? `
        <div class="row" style="background: #eef2eb; margin-top: 10px; border-radius: 8px;">
          <span class="lbl" style="color: #2D6A4F;">Assessment Attached</span>
          <span class="val highlight"><a href="${assessmentUrl}" target="_blank" style="color: #2D6A4F; font-weight: 800; text-decoration: underline;">View Result Dashboard</a></span>
        </div>` : ''}
      </div>

      <div style="font-size: 13px; color: #666; line-height: 1.6;">
        <strong>Action Required:</strong> A complete intake PDF with all questionnaire answers is attached to this email. Please review it before the session.
      </div>
    </div>
  </div>
</body>
</html>`;

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey
    };

    // 1. Send to Customer
    const customerRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: [{ email: customerEmail, name: toName }],
        sender: { email: 'intelcounselling@gmail.com', name: 'Intel Counselling' },
        subject: `Thank You for Choosing Intel Counselling`,
        htmlContent: customerHtml
      })
    });

    if (!customerRes.ok) {
      const err = await customerRes.json();
      console.error('Failed to send customer email:', err);
      // We don't abort immediately so admin could still potentially get an email, but typically it returns
      return res.status(500).json({ error: 'Failed to send customer confirmation email' });
    }

    // Generate PDF Base64
    let attachmentBase64 = null;
    try {
      if (fullDetails) {
        attachmentBase64 = await createPdfBufferBase64(fullDetails);
      }
    } catch (pdfErr) {
      console.error('Failed to generate PDF:', pdfErr);
    }

    const adminPayload = {
      to: [{ email: 'intelcounselling@gmail.com', name: 'Intel Counselling Admin' }],
      sender: { email: 'intelcounselling@gmail.com', name: 'Intel Counselling Bookings' },
      subject: `🔔 New Session Booking: ${toName} (${sessionMode})`,
      htmlContent: adminHtml
    };

    // Append PDF attachment if successfully generated
    if (attachmentBase64) {
      adminPayload.attachment = [
        {
          content: attachmentBase64,
          name: `${toName.replace(/\s+/g, '_')}_Intake_Form.pdf`
        }
      ];
    }

    // 2. Send to Admin
    const adminRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify(adminPayload)
    });

    if (!adminRes.ok) {
      const err = await adminRes.json();
      console.error('Failed to send admin email:', err);
      return res.status(500).json({ error: 'Failed to send admin notification email' });
    }

    res.status(200).json({ success: true, message: 'Confirmation emails sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
