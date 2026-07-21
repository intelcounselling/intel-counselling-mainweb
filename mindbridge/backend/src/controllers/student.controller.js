const prisma = require('../prisma');
const { calculateScore } = require('../utils/scoringLogic');
const { createAlertAndNotify } = require('../services/alert.service');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { handleError } = require('../utils/errorHandler');

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(req, res) {
  try {
    const studentId = req.user.id;

    const [tests, recentResults, concerns, student, appointments] = await Promise.all([
      prisma.test.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
      prisma.testResult.findMany({
        where: { studentId },
        take: 5,
        orderBy: { takenAt: 'desc' },
        include: { test: { select: { name: true, category: true } } },
      }),
      prisma.concern.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.user.findUnique({
        where: { id: studentId },
        include: { school: { select: { name: true } } },
      }),
      prisma.appointment.findMany({
        where: { 
          patientId: studentId,
          slot: { gte: new Date() }
        },
        orderBy: { slot: 'asc' },
        take: 3,
        include: { psychiatrist: { select: { firstName: true, lastName: true, avatarUrl: true } } }
      })
    ]);

    // Get latest result per test category
    const latestByCategory = {};
    for (const result of recentResults) {
      const cat = result.test.category;
      if (!latestByCategory[cat]) latestByCategory[cat] = result;
    }

    res.json({ student, tests, recentResults, latestByCategory: Object.values(latestByCategory), concerns, upcomingAppointments: appointments });
  } catch (err) {
    handleError(res, err, 'getDashboard (student)');
  }
}

async function completeOnboarding(req, res) {
  try {
    const student = await prisma.user.update({
      where: { id: req.user.id },
      data: { isOnboarded: true },
    });
    res.json({ success: true, student });
  } catch (err) {
    handleError(res, err, 'completeOnboarding');
  }
}

// ── Tests ─────────────────────────────────────────────────────

async function getTests(req, res) {
  try {
    const tests = await prisma.test.findMany({ where: { isActive: true } });
    res.json({ tests });
  } catch (err) {
    handleError(res, err, 'getTests');
  }
}

async function submitTest(req, res) {
  try {
    const { testId } = req.params;
    const { answers, shareWithTherapist } = req.body;
    const studentId = req.user.id;

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) return res.status(404).json({ error: 'Test not found' });

    const questions = test.questions;
    const thresholds = test.thresholds;

    let answersMap = {};
    if (Array.isArray(answers)) {
      answers.forEach(a => { answersMap[a.questionId || a.id] = parseInt(a.value ?? a) || 0; });
    } else if (typeof answers === 'object') {
      answersMap = Object.keys(answers).reduce((acc, key) => {
        acc[key] = parseInt(answers[key].value ?? answers[key]) || 0;
        return acc;
      }, {});
    }

    const {
      score,
      severity,
      isLow,
      subScores,
      requiresCounselling,
      validityWarning
    } = calculateScore(answersMap, questions, thresholds, test.category);

    const result = await prisma.testResult.create({
      data: {
        studentId,
        testId,
        score,
        maxScore: 60, // most are out of 60 based on logic, visual/auditory/kinesthetic is 20 max each
        severity: validityWarning ? `[Validity Warning] ${severity}` : severity,
        isLow: requiresCounselling || isLow,
        answers: answersMap || {},
        subScores: subScores || undefined,
        sharedWithTherapist: shareWithTherapist ?? (requiresCounselling || isLow),
      },
      include: { test: { select: { name: true, category: true, thresholds: true } } },
    });

    // Trigger alert if isLow
    if (isLow) {
      createAlertAndNotify({
        studentId,
        resultId: result.id,
        severity,
        testName: test.name,
        score,
        maxScore,
      }).catch(err => console.error('Alert error:', err));
    }

    res.status(201).json({ result, severity, isLow });
  } catch (err) {
    handleError(res, err, 'submitTest');
  }
}

// ── Results ───────────────────────────────────────────────────

async function getResults(req, res) {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const [results, total] = await Promise.all([
      prisma.testResult.findMany({
        where: { studentId: req.user.id },
        skip,
        take,
        orderBy: { takenAt: 'desc' },
        include: { test: { select: { name: true, category: true } } },
      }),
      prisma.testResult.count({ where: { studentId: req.user.id } }),
    ]);
    res.json({ results, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    handleError(res, err, 'getResults (student)');
  }
}

async function getResult(req, res) {
  try {
    const { id } = req.params;
    const result = await prisma.testResult.findFirst({
      where: { id, studentId: req.user.id },
      include: { test: true },
    });
    if (!result) return res.status(404).json({ error: 'Result not found' });
    res.json({ result });
  } catch (err) {
    handleError(res, err, 'getResult (student)');
  }
}

// ── Concerns ──────────────────────────────────────────────────

async function submitConcern(req, res) {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    const concern = await prisma.concern.create({
      data: { studentId: req.user.id, message: message.trim() },
    });
    res.status(201).json({ concern });
  } catch (err) {
    handleError(res, err, 'submitConcern');
  }
}

async function getConcerns(req, res) {
  try {
    const concerns = await prisma.concern.findMany({
      where: { studentId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ concerns });
  } catch (err) {
    handleError(res, err, 'getConcerns');
  }
}

module.exports = { getDashboard, getTests, submitTest, getResults, getResult, submitConcern, getConcerns, completeOnboarding };
