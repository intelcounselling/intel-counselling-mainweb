const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Generate a session report PDF and stream it to res.
 * @param {Object} res - Express response object
 * @param {Object} data - Report data
 */
async function generateSessionReport(res, { appointment, patient, psychiatrist, school, results }) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Intel Counselling_Report_${patient.firstName}_${patient.lastName}_${new Date().toISOString().split('T')[0]}.pdf"`
  );

  doc.pipe(res);

  // ── Header ──────────────────────────────────────────────────
  // Intel Counselling branding
  doc
    .fillColor('#4F46E5')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('Intel Counselling', 50, 50);

  doc
    .fillColor('#0EA5E9')
    .fontSize(12)
    .font('Helvetica')
    .text('Student Mental Health Platform', 50, 78);

  // School info
  if (school) {
    doc
      .fillColor('#374151')
      .fontSize(10)
      .text(`${school.name}`, 380, 50, { align: 'right', width: 170 })
      .text(`${school.address || ''}`, 380, 64, { align: 'right', width: 170 });
  }

  // Divider
  doc
    .moveTo(50, 100)
    .lineTo(545, 100)
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .stroke();

  doc.moveDown(2);

  // ── Report Title ─────────────────────────────────────────────
  doc
    .fillColor('#111827')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('Session Report', 50, 120);

  doc
    .fillColor('#6B7280')
    .fontSize(10)
    .font('Helvetica')
    .text(`Generated: ${new Date().toLocaleString()}`, 50, 142);

  doc.moveDown(1.5);

  // ── Patient Info ─────────────────────────────────────────────
  doc
    .fillColor('#4F46E5')
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Patient Information', 50, 170);

  const patientInfo = [
    ['Name', `${patient.firstName} ${patient.lastName}`],
    ['Grade', patient.grade || 'N/A'],
    ['Date of Birth', patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'],
    ['School', school?.name || 'N/A'],
  ];

  drawTable(doc, 50, 190, patientInfo);

  // ── Appointment Info ──────────────────────────────────────────
  doc
    .fillColor('#4F46E5')
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Appointment Details', 50, 300);

  const apptInfo = [
    ['Date & Time', new Date(appointment.slot).toLocaleString()],
    ['Psychiatrist', `Dr. ${psychiatrist.firstName} ${psychiatrist.lastName}`],
    ['Status', appointment.status],
    ['Meeting Link', appointment.meetingLink || 'In-person'],
  ];

  drawTable(doc, 50, 320, apptInfo);

  // ── Test Results ─────────────────────────────────────────────
  if (results && results.length > 0) {
    doc
      .fillColor('#4F46E5')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('Assessment Results', 50, 430);

    let y = 450;
    for (const result of results) {
      const testName = result.test?.name || 'Unknown Test';
      const severityColor = getSeverityColor(result.severity);

      doc
        .fillColor('#111827')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`${testName}`, 50, y);

      doc
        .fillColor('#6B7280')
        .fontSize(10)
        .font('Helvetica')
        .text(`Score: ${result.score}/${result.maxScore}  |  Severity: `, 50, y + 16)
        .fillColor(severityColor)
        .text(result.severity.toUpperCase(), { continued: false });

      doc
        .fillColor('#6B7280')
        .text(`Date: ${new Date(result.takenAt).toLocaleDateString()}`, 50, y + 30);

      // Severity bar
      const barWidth = Math.round((result.score / result.maxScore) * 300);
      doc
        .roundedRect(50, y + 44, 300, 8, 4)
        .fillColor('#F3F4F6')
        .fill();
      doc
        .roundedRect(50, y + 44, barWidth, 8, 4)
        .fillColor(severityColor)
        .fill();

      y += 70;

      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    }
  }

  // ── Notes Section ─────────────────────────────────────────────
  if (appointment.notes) {
    const notesY = doc.y + 20;
    doc
      .fillColor('#4F46E5')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('Session Notes', 50, notesY);

    doc
      .fillColor('#374151')
      .fontSize(10)
      .font('Helvetica')
      .text(appointment.notes, 50, notesY + 20, { width: 495, lineGap: 4 });
  }

  // ── Footer ────────────────────────────────────────────────────
  const pageHeight = doc.page.height;
  doc
    .fillColor('#9CA3AF')
    .fontSize(9)
    .text('This report is confidential and intended for mental health professionals only.', 50, pageHeight - 60, { align: 'center', width: 495 })
    .text('Intel Counselling — Student Mental Health Platform', 50, pageHeight - 46, { align: 'center', width: 495 });

  doc.end();
}

function drawTable(doc, x, y, rows) {
  rows.forEach(([label, value], i) => {
    const rowY = y + i * 22;
    if (i % 2 === 0) {
      doc.rect(x, rowY, 495, 22).fillColor('#F9FAFB').fill();
    }
    doc
      .fillColor('#6B7280')
      .fontSize(10)
      .font('Helvetica')
      .text(label, x + 8, rowY + 6);
    doc
      .fillColor('#111827')
      .font('Helvetica-Bold')
      .text(value?.toString() || 'N/A', x + 150, rowY + 6);
  });
}

function getSeverityColor(severity) {
  const map = {
    minimal: '#16a34a',
    mild: '#ca8a04',
    moderate: '#ea580c',
    'moderately severe': '#dc2626',
    severe: '#dc2626',
    low: '#16a34a',
    high: '#dc2626',
  };
  return map[severity?.toLowerCase()] || '#6B7280';
}

async function generateDetailedStudentReport(res, { student, results }) {
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="MindBridge_Student_Report_${student.firstName}_${student.lastName}_${new Date().toISOString().split('T')[0]}.pdf"`
  );

  doc.pipe(res);

  // 1. Branding Header
  doc
    .fillColor('#4F46E5')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('MindBridge Platform', 50, 50);

  doc
    .fillColor('#0EA5E9')
    .fontSize(12)
    .font('Helvetica')
    .text('Detailed Student Assessment Report', 50, 78);

  doc
    .moveTo(50, 100)
    .lineTo(545, 100)
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .stroke();

  doc.moveDown(2);

  // Title
  doc
    .fillColor('#111827')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('Student Personal Report', 50, 120);

  doc
    .fillColor('#6B7280')
    .fontSize(10)
    .font('Helvetica')
    .text(`Generated: ${new Date().toLocaleString()}`, 50, 142);

  // Student Bio Table
  doc
    .fillColor('#4F46E5')
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Student Details', 50, 170);

  const studentInfo = [
    ['Name', `${student.firstName} ${student.lastName}`],
    ['Email', student.email],
    ['Grade', student.grade || 'N/A'],
    ['School', student.school?.name || 'N/A'],
  ];

  drawTable(doc, 50, 190, studentInfo);

  // Score History / Trend Chart (Vector Drawn!)
  const validResults = (results || []).filter(r => {
    const answers = r.answers || {};
    const answerList = Array.isArray(answers) ? answers : Object.keys(answers);
    return answerList.length > 0;
  });

  if (validResults.length > 0) {
    doc
      .fillColor('#4F46E5')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('Assessment History & Trends', 50, 310);

    const chartX = 70;
    const chartY = 340;
    const chartWidth = 450;
    const chartHeight = 110;

    // Draw chart axes
    doc.lineWidth(1).strokeColor('#E5E7EB')
      .moveTo(chartX, chartY)
      .lineTo(chartX + chartWidth, chartY)
      .moveTo(chartX, chartY + chartHeight)
      .lineTo(chartX + chartWidth, chartY + chartHeight)
      .stroke();

    // Plot trend points (chronological order)
    const sortedResults = [...validResults].sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));
    if (sortedResults.length > 1) {
      const stepX = chartWidth / (sortedResults.length - 1);
      
      // Plot lines
      doc.lineWidth(2).strokeColor('#4F46E5');
      sortedResults.forEach((res, index) => {
        const maxS = res.maxScore || 1;
        const pct = res.score / maxS;
        const ptX = chartX + index * stepX;
        const ptY = chartY + chartHeight - (pct * chartHeight);
        
        if (index === 0) {
          doc.moveTo(ptX, ptY);
        } else {
          doc.lineTo(ptX, ptY);
        }
      });
      doc.stroke();

      // Plot data labels and circles
      sortedResults.forEach((res, index) => {
        const maxS = res.maxScore || 1;
        const pct = res.score / maxS;
        const ptX = chartX + index * stepX;
        const ptY = chartY + chartHeight - (pct * chartHeight);

        // Draw dot
        doc.circle(ptX, ptY, 4).fillColor('#4F46E5').fill();
        
        // Draw score label
        doc.fillColor('#374151').fontSize(8).font('Helvetica-Bold')
          .text(`${res.score}/${res.maxScore}`, ptX - 12, ptY - 14, { width: 30, align: 'center' });

        // Draw date label at bottom
        const dtStr = new Date(res.takenAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
        doc.fillColor('#6B7280').fontSize(8).font('Helvetica')
          .text(dtStr, ptX - 25, chartY + chartHeight + 8, { width: 50, align: 'center' });
      });
    } else if (sortedResults.length === 1) {
      const res = sortedResults[0];
      const maxS = res.maxScore || 1;
      const pct = res.score / maxS;
      const ptX = chartX + chartWidth / 2;
      const ptY = chartY + chartHeight - (pct * chartHeight);
      doc.circle(ptX, ptY, 5).fillColor('#4F46E5').fill();
      doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold')
        .text(`${res.score}/${res.maxScore}`, ptX - 20, ptY - 16, { width: 40, align: 'center' });
      const dtStr = new Date(res.takenAt).toLocaleDateString();
      doc.fillColor('#6B7280').fontSize(8).font('Helvetica')
        .text(dtStr, ptX - 25, chartY + chartHeight + 8, { width: 50, align: 'center' });
    }
  }

  // Detailed responses - page by page
  if (validResults.length > 0) {
    for (const result of validResults) {
      doc.addPage();
      
      // Branding Header on new page
      doc
        .fillColor('#4F46E5')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('MindBridge Detailed Responses', 50, 40);
        
      doc
        .moveTo(50, 60)
        .lineTo(545, 60)
        .strokeColor('#E5E7EB')
        .lineWidth(1)
        .stroke();

      doc.moveDown(1.5);

      // Assessment Title
      doc
        .fillColor('#111827')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(`${result.test?.name || 'Unknown Assessment'}`, 50, 80);

      const sev = result.severity || 'low';
      const severityColor = getSeverityColor(sev);
      doc
        .fillColor('#6B7280')
        .fontSize(10)
        .font('Helvetica')
        .text(`Date Taken: ${new Date(result.takenAt).toLocaleString()}  |  Score: ${result.score}/${result.maxScore}  |  Severity: `, 50, 102)
        .fillColor(severityColor)
        .text(sev.toUpperCase(), { continued: false });

      // Severity bar
      const maxS = result.maxScore || 1;
      const barWidth = Math.round((result.score / maxS) * 300);
      doc
        .roundedRect(50, 118, 300, 8, 4)
        .fillColor('#F3F4F6')
        .fill();
      doc
        .roundedRect(50, 118, barWidth, 8, 4)
        .fillColor(severityColor)
        .fill();

      doc.moveDown(3);

      // Responses Title
      doc
        .fillColor('#4F46E5')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Question Breakdown & Answers', 50, 145);

      // List questions and answers
      const questions = result.test?.questions || [];
      const answers = result.answers || {};
      const answerList = Array.isArray(answers)
        ? answers.map(a => ({ qId: a.questionId || a.id, val: a.value ?? a }))
        : Object.entries(answers).map(([qId, val]) => ({ qId, val }));

      let y = 175;

      answerList.forEach(({ qId, val }, idx) => {
        const q = questions.find(q => q.id === parseInt(qId) || q.id === qId);
        
        let answerLabel = val;
        if (q && q.options) {
          const opt = q.options.find(o => o.value === val);
          if (opt) answerLabel = opt.label;
        }

        const qText = `${idx + 1}. ${q?.text || `Question ${qId}`}`;
        
        if (y > 700) {
          doc.addPage();
          doc
            .fillColor('#4F46E5')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(`${result.test?.name || 'Assessment'} — Responses Continued`, 50, 40);
          doc
            .moveTo(50, 52)
            .lineTo(545, 52)
            .strokeColor('#E5E7EB')
            .lineWidth(1)
            .stroke();
          y = 70;
        }

        doc
          .fillColor('#1F2937')
          .fontSize(9.5)
          .font('Helvetica-Bold')
          .text(qText, 50, y, { width: 495 });

        const textHeight = doc.heightOfString(qText, { width: 495 });
        y += textHeight + 4;

        doc
          .fillColor('#4F46E5')
          .fontSize(9)
          .font('Helvetica')
          .text(`Answer: ${answerLabel} (${val} points)`, 65, y);

        y += 24;
      });
    }
  }

  // Footer on each page
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    const pageHeight = doc.page.height;
    doc
      .fillColor('#9CA3AF')
      .fontSize(8)
      .text('This report is confidential and intended for authorized school administrators only.', 50, pageHeight - 40, { align: 'center', width: 495 })
      .text(`Page ${i + 1} of ${pages.count}`, 50, pageHeight - 26, { align: 'center', width: 495 });
  }

  doc.end();
}

module.exports = { generateSessionReport, generateDetailedStudentReport };
