const PDFDocument = require('pdfkit');
const path = require('path');

// ── Brand ────────────────────────────────────────────────────────
const BRAND = {
  name: 'Intel Counselling',
  tagline: 'Student Mental Health Platform',
  green: '#1C3F39',
  brass: '#C19B6C',
  ink: '#1F2937',
  muted: '#6B7280',
  line: '#E5E7EB',
  band: '#F7F3EC',
};
const LOGO_MARK = path.join(__dirname, '..', 'assets', 'logo-mark.png');

// ── Page geometry (A4 = 595.28 × 841.89 pt) ──────────────────────
const MARGIN = { top: 104, bottom: 64, left: 50, right: 50 };
const CONTENT_W = 595.28 - MARGIN.left - MARGIN.right; // ≈ 495

// Helvetica only covers Latin-1 + a few typographic marks. Anything else
// (emoji, Indic scripts…) would print as garbage, so drop it.
const safe = (v, fallback = '') =>
  String(v ?? fallback).replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF–—‘’“”•…]/g, '');

const IST = { timeZone: 'Asia/Kolkata' };
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { ...IST, day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-IN', { ...IST, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const pct = (score, max) => (max > 0 ? Math.max(0, Math.min(1, score / max)) : 0);

function getSeverityColor(severity) {
  const s = String(severity || '').toLowerCase();
  if (/severe|high|dominant risk/.test(s)) return '#dc2626';
  if (/moderate/.test(s)) return '#ea580c';
  if (/mild/.test(s)) return '#ca8a04';
  if (/minimal|low|stable/.test(s)) return '#16a34a';
  return BRAND.muted;
}

// ── Document setup ───────────────────────────────────────────────

function createDocument(res, { filename, title, footerNote }) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { ...MARGIN },
    bufferPages: true, // lets us stamp "Page X of Y" once the length is known
    info: { Title: title, Author: BRAND.name, Creator: BRAND.name, Producer: BRAND.name },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  // Watermark + header are painted when a page is created, so they sit
  // UNDER the content that follows. (The first page is created by the
  // constructor and emits no event, hence the explicit call.)
  const decorate = () => {
    drawWatermark(doc);
    drawHeader(doc);
    doc.x = MARGIN.left;
    doc.y = MARGIN.top;
  };
  doc.on('pageAdded', decorate);
  decorate();

  doc._footerNote = footerNote;
  return doc;
}

function drawWatermark(doc) {
  const { width, height } = doc.page;
  doc.save();

  // Large faint brand mark, centred
  const size = 300;
  try {
    doc.opacity(0.06).image(LOGO_MARK, (width - size) / 2, (height - size) / 2 - 20, { width: size });
  } catch (_) {
    // A missing logo must never break report generation
  }

  // Diagonal wordmark across the page, centred on the page centre
  doc.translate(width / 2, height / 2).rotate(-38);
  doc.opacity(0.07).fillColor(BRAND.green);
  doc.font('Helvetica-Bold').fontSize(46).text('INTEL COUNSELLING', -300, -34, { width: 600, align: 'center', lineBreak: false, characterSpacing: 2 });
  doc.font('Helvetica-Bold').fontSize(18).text('CONFIDENTIAL', -300, 24, { width: 600, align: 'center', lineBreak: false, characterSpacing: 8 });
  doc.restore();
}

function drawHeader(doc) {
  const { width } = doc.page;
  doc.save();
  try {
    doc.image(LOGO_MARK, MARGIN.left, 34, { height: 44 });
  } catch (_) { /* logo optional */ }

  doc.fillColor(BRAND.green).font('Helvetica-Bold').fontSize(18).text(BRAND.name, MARGIN.left + 54, 40, { lineBreak: false });
  doc.fillColor(BRAND.brass).font('Helvetica').fontSize(9.5).text(BRAND.tagline.toUpperCase(), MARGIN.left + 54, 62, { lineBreak: false, characterSpacing: 1.2 });

  doc.moveTo(MARGIN.left, 88).lineTo(width - MARGIN.right, 88).lineWidth(1.5).strokeColor(BRAND.brass).stroke();
  doc.restore();
}

// Footer + page numbers on every page. Written with the bottom margin
// removed: pdfkit starts a NEW page for any text whose y is below
// (page height − bottom margin), which is what produced the blank pages.
function stampFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const { width, height } = doc.page;
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.save();
    doc.moveTo(MARGIN.left, height - 52).lineTo(width - MARGIN.right, height - 52).lineWidth(0.5).strokeColor(BRAND.line).stroke();
    doc.fillColor('#9CA3AF').font('Helvetica').fontSize(8);
    doc.text(doc._footerNote, MARGIN.left, height - 44, { width: CONTENT_W, align: 'center', lineBreak: false });
    doc.text(`${BRAND.name}  •  Page ${i + 1} of ${range.count}`, MARGIN.left, height - 31, { width: CONTENT_W, align: 'center', lineBreak: false });
    doc.restore();

    doc.page.margins.bottom = savedBottom;
  }
}

// ── Layout helpers ───────────────────────────────────────────────

const bottomLimit = (doc) => doc.page.height - MARGIN.bottom;

// Start a new page only when `needed` points don't fit on this one.
function ensureSpace(doc, needed) {
  if (doc.y + needed > bottomLimit(doc)) doc.addPage();
}

function sectionTitle(doc, text) {
  ensureSpace(doc, 40);
  doc.moveDown(0.6);
  doc.fillColor(BRAND.green).font('Helvetica-Bold').fontSize(12.5).text(safe(text).toUpperCase(), MARGIN.left, doc.y, { characterSpacing: 0.8 });
  doc.moveTo(MARGIN.left, doc.y + 3).lineTo(MARGIN.left + 36, doc.y + 3).lineWidth(2).strokeColor(BRAND.brass).stroke();
  doc.y += 12;
}

function reportTitle(doc, title, subtitle) {
  doc.fillColor(BRAND.ink).font('Helvetica-Bold').fontSize(20).text(safe(title), MARGIN.left, doc.y);
  doc.fillColor(BRAND.muted).font('Helvetica').fontSize(9.5).text(safe(subtitle), MARGIN.left, doc.y + 2);
  doc.y += 10;
}

// Label / value rows that flow with the document (no absolute positions).
function keyValueTable(doc, rows) {
  const rowH = 22;
  rows.forEach(([label, value], i) => {
    ensureSpace(doc, rowH);
    const y = doc.y;
    if (i % 2 === 0) doc.rect(MARGIN.left, y, CONTENT_W, rowH).fillColor(BRAND.band).fill();
    doc.fillColor(BRAND.muted).font('Helvetica').fontSize(9.5).text(safe(label), MARGIN.left + 10, y + 7, { width: 120, lineBreak: false });
    doc.fillColor(BRAND.ink).font('Helvetica-Bold').fontSize(9.5).text(safe(value, 'N/A') || 'N/A', MARGIN.left + 140, y + 7, { width: CONTENT_W - 150, lineBreak: false, ellipsis: true });
    doc.y = y + rowH;
  });
  doc.y += 6;
}

function severityBar(doc, x, y, w, ratio, color) {
  doc.roundedRect(x, y, w, 7, 3.5).fillColor('#EEF0F3').fill();
  if (ratio > 0) doc.roundedRect(x, y, Math.max(7, w * ratio), 7, 3.5).fillColor(color).fill();
}

// One assessment result: title, score line, bar. Keeps itself on one page.
function resultCard(doc, result) {
  const need = 66;
  ensureSpace(doc, need);
  const y = doc.y;
  const color = getSeverityColor(result.severity);
  const severity = safe(result.severity, 'n/a').toUpperCase();

  doc.fillColor(BRAND.ink).font('Helvetica-Bold').fontSize(11).text(safe(result.test?.name, 'Assessment'), MARGIN.left, y, { width: 330, lineBreak: false, ellipsis: true });
  doc.fillColor(color).font('Helvetica-Bold').fontSize(9.5).text(severity, MARGIN.left + 330, y + 1, { width: CONTENT_W - 330, align: 'right', lineBreak: false, ellipsis: true });
  doc.fillColor(BRAND.muted).font('Helvetica').fontSize(9.5).text(
    `Score ${result.score}/${result.maxScore}   •   ${fmtDate(result.takenAt)}`, MARGIN.left, y + 17, { lineBreak: false });
  severityBar(doc, MARGIN.left, y + 36, CONTENT_W, pct(result.score, result.maxScore), color);
  doc.y = y + need;
}

// ── Session report ───────────────────────────────────────────────

/**
 * Generate a session report PDF and stream it to res.
 */
async function generateSessionReport(res, { appointment, patient, psychiatrist, school, results }) {
  const doc = createDocument(res, {
    filename: `Intel_Counselling_Session_Report_${safe(patient.firstName)}_${safe(patient.lastName)}_${new Date().toISOString().split('T')[0]}.pdf`,
    title: `Session Report — ${safe(patient.firstName)} ${safe(patient.lastName)}`,
    footerNote: 'Confidential — intended for authorised mental health professionals only.',
  });

  reportTitle(doc, 'Session Report', `Generated ${fmtDateTime(new Date())}`);

  sectionTitle(doc, 'Student');
  keyValueTable(doc, [
    ['Name', `${patient.firstName} ${patient.lastName}`],
    ['Grade', patient.grade],
    ['Date of birth', patient.dateOfBirth ? fmtDate(patient.dateOfBirth) : 'N/A'],
    ['School', school?.name],
  ]);

  sectionTitle(doc, 'Appointment');
  keyValueTable(doc, [
    ['Date & time', fmtDateTime(appointment.slot)],
    ['Counsellor', psychiatrist ? `${psychiatrist.firstName} ${psychiatrist.lastName}` : 'N/A'],
    ['Status', appointment.status],
    ['Meeting', appointment.meetingLink || 'In person'],
  ]);

  if (results?.length) {
    sectionTitle(doc, 'Assessment results');
    results.forEach((r) => resultCard(doc, r));
  }

  if (appointment.notes) {
    sectionTitle(doc, 'Session notes');
    doc.fillColor(BRAND.ink).font('Helvetica').fontSize(10).text(safe(appointment.notes), MARGIN.left, doc.y, { width: CONTENT_W, lineGap: 4 });
  }

  stampFooters(doc);
  doc.end();
}

// ── Detailed student report ──────────────────────────────────────

function trendChart(doc, results) {
  const chartH = 110;
  ensureSpace(doc, chartH + 50);
  const x0 = MARGIN.left + 24;
  const w = CONTENT_W - 48;
  const top = doc.y + 14;

  // grid
  doc.lineWidth(0.5).strokeColor(BRAND.line);
  [0, 0.5, 1].forEach((f) => doc.moveTo(x0, top + chartH * f).lineTo(x0 + w, top + chartH * f).stroke());
  doc.fillColor('#9CA3AF').font('Helvetica').fontSize(7);
  doc.text('100%', MARGIN.left - 2, top - 3, { width: 24, lineBreak: false });
  doc.text('0%', MARGIN.left + 8, top + chartH - 3, { width: 14, lineBreak: false });

  const sorted = [...results].sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));
  const point = (r, i) => ({
    x: sorted.length > 1 ? x0 + (i * w) / (sorted.length - 1) : x0 + w / 2,
    y: top + chartH - pct(r.score, r.maxScore) * chartH,
  });

  if (sorted.length > 1) {
    doc.lineWidth(2).strokeColor(BRAND.green);
    sorted.forEach((r, i) => { const p = point(r, i); if (i === 0) doc.moveTo(p.x, p.y); else doc.lineTo(p.x, p.y); });
    doc.stroke();
  }
  sorted.forEach((r, i) => {
    const p = point(r, i);
    doc.circle(p.x, p.y, 4).fillColor(BRAND.green).fill();
    doc.fillColor(BRAND.ink).font('Helvetica-Bold').fontSize(7.5).text(`${r.score}/${r.maxScore}`, p.x - 20, p.y - 15, { width: 40, align: 'center', lineBreak: false });
    doc.fillColor(BRAND.muted).font('Helvetica').fontSize(7.5).text(
      new Date(r.takenAt).toLocaleDateString('en-IN', { ...IST, day: 'numeric', month: 'short' }), p.x - 25, top + chartH + 7, { width: 50, align: 'center', lineBreak: false });
  });
  doc.y = top + chartH + 26;
}

function answerRows(result) {
  const questions = result.test?.questions || [];
  const answers = result.answers || {};
  const list = Array.isArray(answers)
    ? answers.map((a) => ({ qId: a.questionId ?? a.id, val: a.value ?? a }))
    : Object.entries(answers).map(([qId, val]) => ({ qId, val }));

  return list.map(({ qId, val }, idx) => {
    const q = questions.find((x) => String(x.id) === String(qId));
    const opt = q?.options?.find((o) => o.value === val);
    return {
      text: `${idx + 1}. ${safe(q?.text, `Question ${qId}`)}`,
      answer: `${safe(opt?.label ?? val)}  (${val} ${val === 1 ? 'point' : 'points'})`,
    };
  });
}

async function generateDetailedStudentReport(res, { student, results }) {
  const doc = createDocument(res, {
    filename: `Intel_Counselling_Student_Report_${safe(student.firstName)}_${safe(student.lastName)}_${new Date().toISOString().split('T')[0]}.pdf`,
    title: `Student Assessment Report — ${safe(student.firstName)} ${safe(student.lastName)}`,
    footerNote: 'Confidential — intended for authorised school administrators and counsellors only.',
  });

  reportTitle(doc, 'Student Assessment Report', `Generated ${fmtDateTime(new Date())}`);

  sectionTitle(doc, 'Student');
  keyValueTable(doc, [
    ['Name', `${student.firstName} ${student.lastName}`],
    ['Email', student.email],
    ['Grade', student.grade],
    ['School', student.school?.name],
  ]);

  if (!results?.length) {
    sectionTitle(doc, 'Assessments');
    doc.fillColor(BRAND.muted).font('Helvetica-Oblique').fontSize(10).text('No assessments have been completed yet.', MARGIN.left, doc.y);
  } else {
    sectionTitle(doc, 'Assessment history & trends');
    trendChart(doc, results);

    sectionTitle(doc, 'Summary');
    results.forEach((r) => resultCard(doc, r));

    // Question-level detail — flows on after the summary; a new page starts
    // only when the heading + first item wouldn't fit, never unconditionally.
    for (const result of results) {
      const rows = answerRows(result);
      if (!rows.length) continue;

      ensureSpace(doc, 120);
      sectionTitle(doc, `${safe(result.test?.name, 'Assessment')} — responses`);
      doc.fillColor(BRAND.muted).font('Helvetica').fontSize(9).text(
        `Taken ${fmtDateTime(result.takenAt)}  •  Score ${result.score}/${result.maxScore}  •  ${safe(result.severity, 'n/a')}`, MARGIN.left, doc.y);
      doc.y += 8;

      rows.forEach((row) => {
        doc.font('Helvetica-Bold').fontSize(9.5);
        const qH = doc.heightOfString(row.text, { width: CONTENT_W });
        ensureSpace(doc, qH + 22);
        doc.fillColor(BRAND.ink).text(row.text, MARGIN.left, doc.y, { width: CONTENT_W });
        doc.fillColor(BRAND.green).font('Helvetica').fontSize(9).text(`Answer: ${row.answer}`, MARGIN.left + 14, doc.y + 2, { width: CONTENT_W - 14 });
        doc.y += 8;
      });
    }
  }

  stampFooters(doc);
  doc.end();
}

module.exports = { generateSessionReport, generateDetailedStudentReport };
