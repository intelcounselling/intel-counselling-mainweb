import PDFDocument from 'pdfkit-table';

const MI_DESC = {
  "Musical Intelligence": "This area has to do with sensitivity to sounds, rhythms, tones, and music. People with a high musical intelligence normally have good pitch and may even have absolute pitch, and are able to sing, play musical instruments, and compose music. They have sensitivity to rhythm, pitch, meter, tone, melody or timbre.",
  "Visual-spatial Intelligence": "This area deals with spatial judgment and the ability to visualize with the mind's eye. Those who are high in this intelligence will be able to think in terms of physical space.",
  "Linguistic Intelligence": "People with high verbal-linguistic intelligence display a facility with words and languages. They are typically good at reading, writing, telling stories and memorizing words along with dates.",
  "Logical-mathematical Intelligence": "This area has to do with logic, abstractions, reasoning, numbers and critical thinking. This also has to do with having the capacity to understand the underlying principles of some kind of causal system.",
  "Bodily-kinesthetic Intelligence": "The core elements of the bodily-kinesthetic intelligence are control of one's bodily motions and the capacity to handle objects skillfully.",
  "Interpersonal Intelligence": "Those with high interpersonal intelligence communicate effectively and empathize easily with others, and may be either leaders or followers. They often enjoy discussion and debate.",
  "Intrapersonal Intelligence": "This area has to do with introspective and self-reflective capacities. This refers to having a deep understanding of the self; what one's strengths or weaknesses are, what makes one unique, being able to predict one's own reactions or emotions.",
  "Naturalistic Intelligence": "This area has to do with nurturing and relating information to one's natural surroundings."
};

const INTEREST_DESC = {
  "Physical Sciences & Technology": "This shows you are interested in the sciences concerned with the study of the inorganic world, including physics, chemistry, astronomy, and their practical applications in terms of Technology.",
  "Biological Sciences & Health": "This interest shows you want to study living organisms, including their physical structure, chemical composition, function and development and their practical applications in improving Health of people.",
  "Mathematical Sciences & Finance": "This area provides you with the opportunity to acquire knowledge and to analyse results. This interest provides you the opportunity to enjoy observing, recording and making deductions with numbers or any other data.",
  "Commerce & Management": "If this is your highest preference, you will be motivated by the chance to earn your living your own way or you would be more interested in co-ordinating the activities of someone else's business.",
  "Social Sciences": "A high score in this area reveals how much you are concerned with society and the relationships among individuals within a society.",
  "Visual Arts": "A preference in this area indicates that you want to use your imagination and express yourself through art which is appreciated by sight, such as painting, sculpture, and film-making.",
  "Performing Arts & Music": "A preference in this area indicates you want to be involved in the form of art in which artists use their voices or bodies, often in relation to other objects, to convey artistic expression or using musical instruments.",
  "Law & Corrections": "This interest is related to the system of rules that are created and enforced through social or governmental institutions to regulate behaviour. Also, you may be interested to be an authority for curing the faults of people who do crimes.",
  "Linguistic": "If this is your high preference, it means that you want to make the business of words the means of making your living.",
  "Sports": "If this is your highest preference, you want to involve in sports or its related activities."
};

const PERSONALITY_DESC = {
  "Realistic": "A personality trait related to being practical, physical and suitable to work with plants and animals, and outdoors activities.",
  "Investigative": "This personality trait involves being analytical, scientific and explorative. People who are high in this would enjoy working with ideas and concepts.",
  "Artistic": "It is a personality trait of being creative, original, independent. Such people like working in unstructured environments and producing something unique.",
  "Social": "People with the trait are more cooperative, supporting, helping and healing/nurturing. They like working in cooperative environments to improve the lives of others.",
  "Enterprising": "People with this trait are suitable to work in competitive environments, has leadership qualities and are persuading. They like working in positions of power to make decisions and carry out projects.",
  "Conventional": "Individuals with this trait are generally detail-oriented, like to work in structured environments to complete tasks with precision and accuracy."
};

async function createPdfBufferBase64(registration, appointment, result) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData.toString('base64'));
      });

      // --- SECTION: CAREER INTEREST PROFILE ---
      doc.fontSize(16).font('Helvetica-Bold').text('CAREER INTEREST PROFILE', { underline: true });
      doc.moveDown(1);
      
      const interestEntries = Object.entries(result.interests || {});
      const interestTable = {
        headers: ['Fields', 'Raw Score'],
        rows: interestEntries.map(([k, v]) => [k, v.toString()])
      };
      
      await doc.table(interestTable, { 
        width: 400,
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(11),
        prepareRow: (row, i) => doc.font("Helvetica").fontSize(11)
      });
      doc.moveDown(1);

      const topInterests = result.summary?.topInterests || [];
      doc.fontSize(11).font('Helvetica-Bold').text(`Top 5: ${topInterests.join(', ')}`);
      doc.moveDown(1);

      topInterests.forEach(interest => {
        if (INTEREST_DESC[interest]) {
          doc.font('Helvetica-Bold').text(`${interest}: `, { continued: true });
          doc.font('Helvetica').text(INTEREST_DESC[interest]);
          doc.moveDown(0.5);
        }
      });
      
      doc.addPage();

      // --- SECTION: CAREER PERSONALITY PROFILE ---
      doc.fontSize(16).font('Helvetica-Bold').text('CAREER PERSONALITY PROFILE', { underline: true });
      doc.moveDown(1);

      const personalityEntries = Object.entries(result.personality || {});
      const personalityTable = {
        headers: ['Dimensions', 'Raw Score'],
        rows: personalityEntries.map(([k, v]) => [k, v.toString()])
      };

      await doc.table(personalityTable, {
        width: 400,
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(11),
        prepareRow: (row, i) => doc.font("Helvetica").fontSize(11)
      });
      doc.moveDown(1);

      // We need top 3 personality (Holland Code)
      const topPersonality = personalityEntries.sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
      doc.fontSize(11).font('Helvetica-Bold').text(`Top 3: ${topPersonality.join(', ')}`);
      doc.moveDown(1);

      topPersonality.forEach(trait => {
        if (PERSONALITY_DESC[trait]) {
          doc.font('Helvetica-Bold').text(`${trait}: `, { continued: true });
          doc.font('Helvetica').text(PERSONALITY_DESC[trait]);
          doc.moveDown(0.5);
        }
      });

      doc.addPage();

      // --- SECTION: CAREER PROFILE ANALYSIS & DISCLAIMER ---
      doc.fontSize(16).font('Helvetica-Bold').text('CAREER PROFILE ANALYSIS', { underline: true });
      doc.moveDown(1);
      
      doc.fontSize(11).font('Helvetica').text(`Dear Ms./Mr. ${registration.name || ''},`);
      doc.moveDown(1);
      doc.text("Thank you for completing the Intel Counselling Career Guidance Assessment. This comprehensive report outlines your vocational interests, career personality, and multiple intelligences to help guide your future academic and professional decisions.");
      doc.moveDown(2);

      doc.font('Helvetica-Bold').text('Test Administered and Results Interpreted by');
      doc.font('Helvetica').text('Intel Counselling Advisory Team');
      doc.text('Career Counselors & Psychologists');
      doc.moveDown(2);

      doc.font('Helvetica-Bold').text('Disclaimer:');
      const disclaimerItems = [
        "This report is highly confidential and may not be read by any individual unless permitted by the person tested.",
        "This test should be read only in the presence of trained professional",
        "Profiles can change with experience and roles",
        "This test is valid up to six months from the time of testing",
        "Test results should be used for career guidance only and not for any other reasons or occasions.",
        "Results are based on the candidate's response to the assessments."
      ];
      doc.font('Helvetica');
      disclaimerItems.forEach(item => {
        doc.text(`• ${item}`, { indent: 15 });
      });

      doc.addPage();

      // --- SECTION: INTERPRETATIONS ---
      doc.fontSize(16).font('Helvetica-Bold').text('Interpretations of the Terms Used', { underline: true });
      doc.moveDown(1);

      doc.fontSize(14).text('Multiple Intelligence');
      doc.moveDown(0.5);
      Object.entries(MI_DESC).forEach(([k, v]) => {
        doc.fontSize(11).font('Helvetica-Bold').text(`${k}: `, { continued: true });
        doc.font('Helvetica').text(v);
        doc.moveDown(0.5);
      });
      doc.moveDown(1);

      doc.fontSize(14).font('Helvetica-Bold').text('Career Interest (Thurstone Interest Fields)');
      doc.moveDown(0.5);
      Object.entries(INTEREST_DESC).forEach(([k, v]) => {
        doc.fontSize(11).font('Helvetica-Bold').text(`${k}: `, { continued: true });
        doc.font('Helvetica').text(v);
        doc.moveDown(0.5);
      });
      doc.moveDown(1);

      doc.fontSize(14).font('Helvetica-Bold').text('Career Personality (Holland Code)');
      doc.moveDown(0.5);
      Object.entries(PERSONALITY_DESC).forEach(([k, v]) => {
        doc.fontSize(11).font('Helvetica-Bold').text(`${k}: `, { continued: true });
        doc.font('Helvetica').text(v);
        doc.moveDown(0.5);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

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

    const formatMi = mi ? Object.entries(mi).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('') : '';
    const formatInterests = interests ? Object.entries(interests).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('') : '';
    const formatPersonality = personality ? Object.entries(personality).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('') : '';

    const hasCounselling = appointment && appointment.date;

    const adminHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Career Assessment Results</title>
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
          <h2 style="color: #1C3F39; margin-top: 0;">🎓 Career Assessment Results ${hasCounselling ? '& Booking' : ''}</h2>
          <p style="color: #666; font-size: 14px; margin-top: -10px; margin-bottom: 25px;">A career guidance assessment has been completed.</p>
          
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

          ${hasCounselling ? `
          <div class="section" style="background: #fdfaf4; padding: 15px; border-radius: 6px; border: 1px solid #ede8e0;">
            <div class="title" style="color: #C19B6C; margin-bottom: 10px;">📅 Scheduled Appointment Details</div>
            <div class="field">
              <div class="label">Format</div>
              <div class="val"><strong>${sessionMode === 'online' ? '🌐 Online (Virtual)' : '🏢 In-Person'}</strong></div>
            </div>
            <div class="field">
              <div class="label">Date & Time Slot</div>
              <div class="val highlight">${date} at ${time}</div>
            </div>
          </div>
          ` : ''}

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

    const userHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Your Career Assessment Report</title>
        <style>
          body { font-family: 'Arial', sans-serif; background: #f9f9f9; padding: 20px; color: #333; }
          .container { background: #fff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
          .header { text-align: center; margin-bottom: 25px; }
          .highlight { font-weight: bold; color: #C19B6C; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="color: #1C3F39; margin-top: 0;">🎓 Intel Counselling Career Assessment Report</h2>
            <p style="color: #666; font-size: 14px;">Your comprehensive evaluation is ready.</p>
          </div>
          
          <p>Dear ${name},</p>
          <p>Thank you for taking the Career Guidance Assessment with Intel Counselling. We have compiled your responses and generated your custom report, which is attached to this email as a PDF document.</p>
          
          ${hasCounselling ? `
          <div style="background: #fdfaf4; padding: 20px; border-radius: 6px; border: 1px solid #ede8e0; margin: 25px 0;">
            <h3 style="color: #C19B6C; margin-top: 0; margin-bottom: 12px;">📅 Confirmed Counselling Session</h3>
            <p style="margin: 5px 0;"><strong>Format:</strong> ${sessionMode === 'online' ? '🌐 Online (Virtual)' : '🏢 In-Person'}</p>
            <p style="margin: 5px 0;"><strong>Scheduled Time:</strong> <span class="highlight">${date} at ${time}</span></p>
            <p style="margin-top: 10px; font-size: 13px; color: #555;">Our expert counselor will review your report with you during this live session to provide detailed interpretation and answer any questions.</p>
          </div>
          ` : ''}

          <p>You can access your report at any time by logging into your portal account.</p>
          <p>Best regards,<br/><strong>Intel Counselling Team</strong></p>
          
          <div style="font-size: 11px; color: #aaa; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
            Healing Begins with Understanding.
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate PDF Attachment
    let pdfBase64 = null;
    try {
      pdfBase64 = await createPdfBufferBase64(registration, appointment, result);
    } catch (pdfErr) {
      console.error('Failed to generate results PDF:', pdfErr);
    }

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey
    };

    const attachmentPayload = pdfBase64 ? [
      {
        content: pdfBase64,
        name: `${name.replace(/\s+/g, '_')}_Career_Guidance_Report.pdf`
      }
    ] : [];

    // Send to Admin
    const adminRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: [{ email: 'intelcounselling@gmail.com', name: 'Intel Counselling Admin' }],
        sender: { email: 'intelcounselling@gmail.com', name: 'Intel Counselling Assessment Portal' },
        replyTo: { email: email, name: name },
        subject: `Career Test Completed: ${name} ${hasCounselling ? `(Session Scheduled: ${date})` : ''}`,
        htmlContent: adminHtml,
        attachment: attachmentPayload
      })
    });

    if (!adminRes.ok) {
      const err = await adminRes.json();
      console.error('Failed to send admin email:', err);
    }

    // Send to User
    const userRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: [{ email: email, name: name }],
        sender: { email: 'intelcounselling@gmail.com', name: 'Intel Counselling' },
        subject: `Your Career Assessment Results - Intel Counselling`,
        htmlContent: userHtml,
        attachment: attachmentPayload
      })
    });

    if (!userRes.ok) {
      const err = await userRes.json();
      console.error('Failed to send user email:', err);
      return res.status(500).json({ error: 'Failed to send user confirmation email' });
    }

    res.status(200).json({ success: true, message: 'Career result email sent successfully.' });
  } catch (error) {
    console.error('Error sending career results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
