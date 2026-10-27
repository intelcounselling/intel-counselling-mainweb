import PDFDocument from 'pdfkit';
import { escapeHtml, plainText } from '../escape.js';
import { emailLayout, p as para, panel, facts, button, h3 } from '../emailTheme.js';
import crypto from 'crypto';
import { getOrder, markOrderUsed, releaseOrder, getResultFull, createBooking } from '../db.js';
import { createMeetLink } from '../meet.js';
import { authenticateRequest } from '../token.js';
import { getAccountById } from '../db.js';
import { intellAccess, loadIntellResults, reportBuffer } from '../intell.js';

function createCareerPdfBufferBase64(registration, appointment, result) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData.toString('base64'));
      });

      doc.fontSize(22).font('Helvetica-Bold').text('Career Assessment Report', { align: 'center' });
      doc.moveDown(1.5);

      const addField = (label, value) => {
        doc.fontSize(11).font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.font('Helvetica').text(value ? value.toString() : 'N/A');
        doc.moveDown(0.4);
      };

      // User Details
      doc.fontSize(14).font('Helvetica-Bold').text('User Details', { underline: true });
      doc.moveDown(0.4);
      addField('Full Name', registration.name);
      addField('Email', registration.email);
      addField('Phone', registration.phone);
      addField('Age', registration.age);
      addField('Gender', registration.gender);
      doc.moveDown();

      // Appointment Details (if any)
      if (appointment && appointment.date) {
        doc.fontSize(14).font('Helvetica-Bold').text('Counselling Session Details', { underline: true });
        doc.moveDown(0.4);
        addField('Format', appointment.sessionMode === 'online' ? 'Online (Virtual)' : 'In-Person');
        addField('Scheduled Time', `${appointment.date} at ${appointment.time}`);
        doc.moveDown();
      }

      // Summary Profile
      doc.fontSize(14).font('Helvetica-Bold').text('Summary Profile', { underline: true });
      doc.moveDown(0.4);
      addField('Top Intelligence Profile', result.summary?.topIntelligence?.join(', '));
      addField('Top Vocational Interests', result.summary?.topInterests?.join(', '));
      doc.moveDown();

      // Multiple Intelligences
      doc.fontSize(14).font('Helvetica-Bold').text('Multiple Intelligences Scores', { underline: true });
      doc.moveDown(0.4);
      Object.entries(result.mi || {}).forEach(([k, v]) => {
        addField(k, `${Math.round((v / 20) * 100)}%`);
      });
      doc.moveDown();

      // Vocational Interests
      doc.fontSize(14).font('Helvetica-Bold').text('Vocational Interests Scores', { underline: true });
      doc.moveDown(0.4);
      Object.entries(result.interests || {}).forEach(([k, v]) => {
        addField(k, `${Math.round((v / 40) * 100)}%`);
      });
      doc.moveDown();

      // Personality
      doc.fontSize(14).font('Helvetica-Bold').text('Career Personality Profile', { underline: true });
      doc.moveDown(0.4);
      Object.entries(result.personality || {}).forEach(([k, v]) => {
        addField(k, `${Math.round((v / 40) * 100)}%`);
      });
      doc.moveDown();

      // Question Breakdown
      if (result.questions && result.answers) {
        doc.fontSize(14).font('Helvetica-Bold').text('Responses Breakdown', { underline: true });
        doc.moveDown(0.5);

        result.questions.forEach((qText, idx) => {
          const scoreVal = result.answers[idx];
          const optLabel = result.options?.find(o => o.value === scoreVal)?.label || `Score: ${scoreVal}`;
          
          doc.fontSize(10).font('Helvetica-Bold').text(`Q${idx + 1}: ${qText}`);
          doc.fontSize(10).font('Helvetica').text(`Response: `, { continued: true });
          doc.font('Helvetica-Bold').text(optLabel);
          doc.moveDown(0.5);
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function createClinicalPdfBufferBase64(registration, appointment, result) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData.toString('base64'));
      });

      doc.fontSize(22).font('Helvetica-Bold').text(`${result.title} Report`, { align: 'center' });
      doc.moveDown(1.5);

      const addField = (label, value) => {
        doc.fontSize(11).font('Helvetica-Bold').text(`${label}: `, { continued: true });
        doc.font('Helvetica').text(value ? value.toString() : 'N/A');
        doc.moveDown(0.4);
      };

      // User Details
      doc.fontSize(14).font('Helvetica-Bold').text('User Details', { underline: true });
      doc.moveDown(0.4);
      addField('Full Name', registration.name);
      addField('Email', registration.email);
      addField('Phone', registration.phone);
      addField('Age', registration.age);
      addField('Gender', registration.gender);
      doc.moveDown();

      // Appointment Details
      if (appointment && appointment.date) {
        doc.fontSize(14).font('Helvetica-Bold').text('Counselling Session Details', { underline: true });
        doc.moveDown(0.4);
        addField('Format', appointment.sessionMode === 'online' ? 'Online (Virtual)' : 'In-Person');
        addField('Scheduled Time', `${appointment.date} at ${appointment.time}`);
        doc.moveDown();
      }

      // Assessment Result
      doc.fontSize(14).font('Helvetica-Bold').text('Assessment Result', { underline: true });
      doc.moveDown(0.4);
      addField('Total Score', `${result.score}`);
      addField('Severity Level', result.band?.label);
      doc.moveDown(0.5);
      
      doc.fontSize(11).font('Helvetica-Oblique').text(result.band?.desc || '');
      doc.moveDown(1.5);

      // Question Breakdown
      doc.fontSize(14).font('Helvetica-Bold').text('Responses Breakdown', { underline: true });
      doc.moveDown(0.5);

      result.questions.forEach((qText, idx) => {
        const scoreVal = result.answers[idx];
        const optLabel = result.options?.find(o => o.value === scoreVal)?.label || `Score: ${scoreVal}`;
        
        doc.fontSize(10).font('Helvetica-Bold').text(`Q${idx + 1}: ${qText}`);
        doc.fontSize(10).font('Helvetica').text(`Response: `, { continued: true });
        doc.font('Helvetica-Bold').text(optLabel);
        doc.moveDown(0.5);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

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
      rescheduleInfo,
      fullDetails,
      assessmentUrl,
      shareAssessmentResult,
      careerResult,
      clinicalResult,
      orderId,
      isFree,
      freeResultId
    } = req.body;

    console.log('Received booking body payload:', JSON.stringify({ shareAssessmentResult, hasCareerResult: !!careerResult, hasClinicalResult: !!clinicalResult }, null, 2));

    // Validate required fields before sending anything (avoids a crash after
    // the customer email is already sent, which caused double-sends on retry).
    if (!toName || typeof toName !== 'string' || !customerEmail || typeof customerEmail !== 'string') {
      return res.status(400).json({ error: 'Missing required fields: toName and customerEmail' });
    }

    // Paid bookings must reference a server-verified PAID session order; the order
    // is consumed after the confirmation is sent so it can't be reused. Free
    // bookings must reference a career assessment result whose paid order was for
    // the package that includes a free session.
    let orderToConsume = null;
    if (isFree === true) {
      const freeError = { error: 'Free session not available for this booking' };
      if (typeof freeResultId !== 'string' || !freeResultId) {
        return res.status(402).json(freeError);
      }
      const result = await getResultFull(freeResultId);
      if (!result || result.test_id !== 'career' || !result.order_id) {
        return res.status(402).json(freeError);
      }
      const resultOrder = await getOrder(result.order_id);
      // Must still be PAID — 'USED' means the free session was already claimed
      if (
        !resultOrder ||
        resultOrder.status !== 'PAID' ||
        resultOrder.service_id !== 'career_assessment_plus'
      ) {
        return res.status(402).json(freeError);
      }
      orderToConsume = result.order_id;
    } else {
      if (typeof orderId !== 'string' || !/^ORDER_[a-f0-9]+$/.test(orderId)) {
        return res.status(402).json({ error: 'Payment not verified for this booking' });
      }
      const order = await getOrder(orderId);
      if (!order || order.status !== 'PAID' || !String(order.service_id).startsWith('session')) {
        return res.status(402).json({ error: 'Payment not verified for this booking' });
      }
      orderToConsume = orderId;
    }

    const details = fullDetails || {};

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'BREVO_API_KEY is not set' });
    }

    // Claim the order atomically BEFORE sending: two concurrent requests with
    // the same payment can no longer both pass the PAID check and both book.
    // If sending fails below, the finally block releases it for a retry.
    if (!(await markOrderUsed(orderToConsume))) {
      return res.status(402).json({ error: 'Payment not verified for this booking' });
    }
    let sent = false;
    try {

      const isOnline = sessionMode && sessionMode.toLowerCase().includes('online');
      // Meet link is created here, after payment is verified — a client-supplied
      // link would be an untrusted URL placed into an email from the clinic.
      const meetLink = isOnline
        ? await createMeetLink({
            summary: `Intel Counselling Session — ${plainText(toName)}`,
            description: plainText(serviceName || 'Consultation'),
            date: appointmentDate,
            time: appointmentTime,
          })
        : null;
      const meetBlock = meetLink
        ? panel(`<strong>Your Google Meet link</strong><br/><a href="${escapeHtml(meetLink)}" style="color:#1C3F39;">${escapeHtml(meetLink)}</a>`, 'sky')
        : '';
      const sessionBadge = isOnline ? '🌐 Online (Virtual)' : '🏢 In-Person';
      const rescheduleText = rescheduleInfo || 'To reschedule, please reply to this email at least 24 hours in advance.';

      // ── Customer HTML (Simplified Thank You) ──────────────────────────────────
      const customerHtml = emailLayout({
        title: 'Thank you for choosing Intel Counselling',
        preheader: 'We have received your booking and payment.',
        eyebrow: 'Booking received',
        heading: `Thank you, ${escapeHtml(toName)}`,
        body:
          para('We have received your booking request and payment. Thank you for choosing <strong>Intel Counselling</strong> as your partner in healing.') +
          panel(
            '<strong>What happens next</strong><br/>Our team is reviewing your intake details now and will contact you shortly to confirm your session and share anything you need.',
            'sage'
          ) +
          h3('Your session') +
          facts([
            ['Date', escapeHtml(appointmentDate)],
            ['Time', escapeHtml(appointmentTime)],
            ['Format', isOnline ? 'Online (Google Meet)' : 'In person'],
            ['Service', escapeHtml(serviceName || '')],
          ]) +
          meetBlock +
          para(escapeHtml(rescheduleText), 'font-size:14px;color:#8a847a;'),
      });

      // ── Admin HTML (Focus on Logistics & Intake) ───────────────────────────────
      const adminHtml = emailLayout({
        title: 'New booking',
        preheader: `${plainText(toName)} booked ${plainText(appointmentDate)} at ${plainText(appointmentTime)}`,
        eyebrow: 'New session booking',
        heading: `Patient: ${escapeHtml(toName)}`,
        audience: 'team',
        body:
          facts([
            ['When', `<strong>${escapeHtml(appointmentDate)} at ${escapeHtml(appointmentTime)}</strong>`],
            ['Mode', sessionBadge],
            ['Meet link', meetLink ? `<a href="${escapeHtml(meetLink)}" style="color:#1C3F39;">${escapeHtml(meetLink)}</a>` : ''],
            ['Concerns', escapeHtml(details.mainConcerns?.join(', ')) || 'General'],
          ]) +
          panel('<strong>Action required</strong><br/>A complete intake PDF with all questionnaire answers is attached. Please review it before the session.', 'peach'),
      });

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
          sender: { email: process.env.SENDER_EMAIL || 'intelcounselling@gmail.com', name: 'Intel Counselling' },
          subject: `Thank You for Choosing Intel Counselling`,
          htmlContent: customerHtml
        })
      });

      if (!customerRes.ok) {
        const err = await customerRes.json().catch(() => ({}));
        console.error('Failed to send customer email:', err);
        // We don't abort immediately so admin could still potentially get an email, but typically it returns
        return res.status(500).json({ error: 'Failed to send customer confirmation email' });
      }

      // Generate PDF Base64
      let attachmentBase64 = null;
      try {
        if (fullDetails) {
          console.log('Generating intake PDF...');
          attachmentBase64 = await createPdfBufferBase64(fullDetails);
          console.log('Intake PDF generated. Length:', attachmentBase64.length);
        }
      } catch (pdfErr) {
        console.error('Failed to generate PDF:', pdfErr);
      }

      // Generate Career Assessment PDF if shared
      let careerPdfBase64 = null;
      if (shareAssessmentResult && careerResult) {
        try {
          const appointmentObj = {
            sessionMode: sessionMode,
            date: appointmentDate,
            time: appointmentTime
          };
          const registrationObj = {
            name: toName,
            email: customerEmail,
            phone: details.phone || '',
            age: details.age || '',
            gender: details.gender || ''
          };
          careerPdfBase64 = await createCareerPdfBufferBase64(registrationObj, appointmentObj, careerResult);
        } catch (careerPdfErr) {
          console.error('Failed to generate career assessment PDF:', careerPdfErr);
        }
      }

      // Generate Clinical Assessment PDF if shared
      let clinicalPdfBase64 = null;
      if (shareAssessmentResult && clinicalResult) {
        try {
          const appointmentObj = {
            sessionMode: sessionMode,
            date: appointmentDate,
            time: appointmentTime
          };
          const registrationObj = {
            name: toName,
            email: customerEmail,
            phone: details.phone || '',
            age: details.age || '',
            gender: details.gender || ''
          };
          clinicalPdfBase64 = await createClinicalPdfBufferBase64(registrationObj, appointmentObj, clinicalResult);
        } catch (clinicalPdfErr) {
          console.error('Failed to generate clinical assessment PDF:', clinicalPdfErr);
        }
      }

      // Intel Student Assessments: a signed-in buyer who shares their results gets
      // the full report (all tests, profile, answers) attached for the counsellor.
      let intellPdfBase64 = null;
      if (req.body?.shareIntellReport === true) {
        try {
          const bookerId = await authenticateRequest(req);
          const access = bookerId ? await intellAccess(bookerId) : { a: false };
          if (access.a) {
            const intellResults = (await loadIntellResults(bookerId)).filter((r) => access.b || /^intell_/.test(r.testId));
            if (intellResults.length) {
              intellPdfBase64 = (await reportBuffer(await getAccountById(bookerId), intellResults, access.b)).toString('base64');
            }
          }
        } catch (intellErr) {
          console.error('Failed to generate Intel assessment PDF:', intellErr);
        }
      }

      const adminPayload = {
        to: [{ email: process.env.ADMIN_EMAIL || 'intelcounselling@gmail.com', name: 'Intel Counselling Admin' }],
        sender: { email: process.env.SENDER_EMAIL || 'intelcounselling@gmail.com', name: 'Intel Counselling Bookings' },
        subject: `${isFree === true ? '[FREE] ' : ''}🔔 New Session Booking: ${plainText(toName)} (${plainText(sessionMode)})`,
        htmlContent: adminHtml,
        attachment: []
      };

      const safeName = (toName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');

      // Append PDF attachments if successfully generated
      if (attachmentBase64) {
        adminPayload.attachment.push({
          content: attachmentBase64,
          name: `${safeName}_Intake_Form.pdf`
        });
      }

      if (careerPdfBase64) {
        adminPayload.attachment.push({
          content: careerPdfBase64,
          name: `${safeName}_Career_Guidance_Report.pdf`
        });
      }

      if (clinicalPdfBase64) {
        adminPayload.attachment.push({
          content: clinicalPdfBase64,
          name: `${safeName}_${String(clinicalResult?.title || 'Clinical').replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`
        });
      }

      if (intellPdfBase64) {
        adminPayload.attachment.push({
          content: intellPdfBase64,
          name: `${safeName}_Intell_Assessment_Report.pdf`
        });
      }

      if (adminPayload.attachment.length === 0) {
        delete adminPayload.attachment;
      }

      // 2. Send to Admin
      const adminRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers,
        body: JSON.stringify(adminPayload)
      });

      if (!adminRes.ok) {
        const err = await adminRes.json().catch(() => ({}));
        console.error('Failed to send admin email:', err);
        return res.status(500).json({ error: 'Failed to send admin notification email' });
      }

      // Durable record of the booking (the emails alone are not one). A DB
      // failure here must not undo a booking the customer already got emails for.
      await createBooking({
        id: crypto.randomUUID(),
        orderId: orderToConsume,
        name: plainText(toName).slice(0, 200),
        email: plainText(customerEmail).slice(0, 200),
        serviceName: plainText(serviceName || '').slice(0, 300),
        sessionMode: isOnline ? 'online' : 'inperson',
        date: String(appointmentDate || '').slice(0, 20),
        time: String(appointmentTime || '').slice(0, 20),
        meetLink,
        isFree: isFree === true,
      }).catch((err) => console.error('Failed to record booking', orderToConsume, err));

      sent = true;
      res.status(200).json({ success: true, meetLink, message: 'Confirmation emails sent successfully.' });
    } finally {
      if (!sent) {
        await releaseOrder(orderToConsume).catch((err) => console.error('Failed to release order', orderToConsume, err));
      }
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
