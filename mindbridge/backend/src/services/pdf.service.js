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

module.exports = { generateSessionReport };
