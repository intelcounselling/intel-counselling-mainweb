const prisma = require('../prisma');
const { sendAppointmentEmail } = require('../services/email.service');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { handleError } = require('../utils/errorHandler');

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(req, res) {
  try {
    const parentId = req.user.id;

    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      include: {
        familyAsParent: {
          include: {
            students: {
              include: {
                testResults: {
                  take: 5,
                  orderBy: { takenAt: 'desc' },
                  include: { test: { select: { name: true, category: true } } },
                },
                alerts: {
                  where: { status: 'UNREAD' },
                },
              },
            },
          },
        },
      },
    });

    const children = parent?.familyAsParent?.students || [];

    res.json({ parent, children });
  } catch (err) {
    handleError(res, err, 'getDashboard (parent)');
  }
}

// ── Children ──────────────────────────────────────────────────

async function getChildren(req, res) {
  try {
    const parent = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        familyAsParent: {
          include: {
            students: {
              select: {
                id: true, firstName: true, lastName: true,
                grade: true, dateOfBirth: true, avatarUrl: true,
                school: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const children = parent?.familyAsParent?.students || [];
    res.json({ children });
  } catch (err) {
    handleError(res, err, 'getChildren');
  }
}

async function getChildResults(req, res) {
  try {
    const { childId } = req.params;
    const { skip, take, page, limit } = parsePagination(req.query);

    // Verify child belongs to parent's family
    const parent = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { familyAsParent: { include: { students: { select: { id: true } } } } },
    });
    const childIds = parent?.familyAsParent?.students.map(s => s.id) || [];
    if (!childIds.includes(childId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [results, total] = await Promise.all([
      prisma.testResult.findMany({
        where: { studentId: childId },
        skip,
        take,
        orderBy: { takenAt: 'desc' },
        include: { test: { select: { name: true, category: true } } },
      }),
      prisma.testResult.count({ where: { studentId: childId } }),
    ]);

    res.json({ results, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    handleError(res, err, 'getChildResults');
  }
}

async function getChildResult(req, res) {
  try {
    const { childId, resultId } = req.params;

    // Verify child belongs to parent's family
    const parent = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { familyAsParent: { include: { students: { select: { id: true } } } } },
    });
    const childIds = parent?.familyAsParent?.students.map(s => s.id) || [];
    if (!childIds.includes(childId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await prisma.testResult.findFirst({
      where: { id: resultId, studentId: childId },
      include: { test: true },
    });

    if (!result) return res.status(404).json({ error: 'Result not found' });
    res.json({ result });
  } catch (err) {
    handleError(res, err, 'getChildResult');
  }
}

// ── Appointments ──────────────────────────────────────────────

async function bookAppointment(req, res) {
  try {
    const { childId, psychiatristId, slot, notes, meetingLink } = req.body;

    // Verify child belongs to parent's family
    const parent = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { familyAsParent: { include: { students: { select: { id: true } } } } },
    });
    const childIds = parent?.familyAsParent?.students.map(s => s.id) || [];
    if (!childIds.includes(childId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get last 3 results for the child
    const recentResults = await prisma.testResult.findMany({
      where: { studentId: childId },
      take: 3,
      orderBy: { takenAt: 'desc' },
    });

    const appointment = await prisma.appointment.create({
      data: {
        patientId: childId,
        psychiatristId,
        slot: new Date(slot),
        notes,
        meetingLink,
        results: { connect: recentResults.map(r => ({ id: r.id })) },
      },
      include: {
        patient: true,
        psychiatrist: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // Email parent
    try {
      await sendAppointmentEmail({
        to: req.user.email,
        parentName: `${parent.firstName} ${parent.lastName}`,
        studentName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        psychiatristName: `${appointment.psychiatrist.firstName} ${appointment.psychiatrist.lastName}`,
        slot,
        notes,
        meetingLink,
      });
    } catch (emailErr) {
      console.error('Appointment email error:', emailErr);
    }

    res.status(201).json({ appointment });
  } catch (err) {
    handleError(res, err, 'bookAppointment');
  }
}

async function getAppointments(req, res) {
  try {
    const parent = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { familyAsParent: { include: { students: { select: { id: true } } } } },
    });
    const childIds = parent?.familyAsParent?.students.map(s => s.id) || [];

    const appointments = await prisma.appointment.findMany({
      where: { patientId: { in: childIds } },
      orderBy: { slot: 'desc' },
      include: {
        patient: { select: { firstName: true, lastName: true, grade: true } },
        psychiatrist: { select: { firstName: true, lastName: true } },
        results: { include: { test: { select: { name: true } } } },
      },
    });

    res.json({ appointments });
  } catch (err) {
    handleError(res, err, 'getAppointments (parent)');
  }
}

// ── Package 2: Parent Perspective & Comparison Report ───────────────

// Parent submits their assessment of the child (same tests, parent's perspective)
async function submitParentPerspective(req, res) {
  try {
    const parentId = req.user.id;
    const { childId, testId, answers } = req.body;
    if (!childId || !testId || !answers) {
      return res.status(400).json({ error: 'childId, testId, and answers are required' });
    }

    // Verify child belongs to parent
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      include: { familyAsParent: { include: { students: { select: { id: true } } } } },
    });
    const childIds = parent?.familyAsParent?.students.map(s => s.id) || [];
    if (!childIds.includes(childId)) return res.status(403).json({ error: 'Access denied' });

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) return res.status(404).json({ error: 'Test not found' });

    // Calculate score
    let score = 0;
    const answerArr = Array.isArray(answers) ? answers : Object.values(answers);
    score = answerArr.reduce((sum, a) => sum + (parseInt(a.value ?? a) || 0), 0);
    const maxScore = test.questions.reduce((sum, q) => {
      const maxVal = Math.max(...(q.options || []).map(o => o.value || 0));
      return sum + maxVal;
    }, 0);

    const thresholds = test.thresholds;
    const band = thresholds.find(b => score >= b.min && score <= b.max) || thresholds[0];

    // Compute sub-scores if questions have dimensions
    const subScores = {};
    if (Array.isArray(test.questions) && test.questions[0]?.dimension) {
      for (const q of test.questions) {
        const ans = answerArr.find(a => a.questionId === q.id || a.id === q.id);
        if (ans !== undefined) {
          const val = parseInt(ans.value ?? ans) || 0;
          subScores[q.dimension] = (subScores[q.dimension] || 0) + val;
        }
      }
    }

    const result = await prisma.testResult.create({
      data: {
        studentId: childId,
        testId,
        score,
        maxScore,
        severity: band.severity || 'unknown',
        isLow: false,
        answers: answers,
        subScores: Object.keys(subScores).length > 0 ? subScores : undefined,
        isParentPerspective: true,
        parentId,
        sharedWithTherapist: false,
      },
    });

    res.status(201).json({ result });
  } catch (err) {
    handleError(res, err, 'submitParentPerspective');
  }
}

// Generate comparison report for a child
async function getComparisonReport(req, res) {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;

    // Verify access
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      include: { familyAsParent: { include: { students: { select: { id: true } } } } },
    });
    const childIds = parent?.familyAsParent?.students.map(s => s.id) || [];
    if (!childIds.includes(childId)) return res.status(403).json({ error: 'Access denied' });

    // Get latest student results (not parent perspective)
    const studentResults = await prisma.testResult.findMany({
      where: { studentId: childId, isParentPerspective: false },
      orderBy: { takenAt: 'desc' },
      include: { test: { select: { name: true, category: true, thresholds: true } } },
    });

    // Get latest parent perspective results
    const parentResults = await prisma.testResult.findMany({
      where: { studentId: childId, isParentPerspective: true, parentId },
      orderBy: { takenAt: 'desc' },
      include: { test: { select: { name: true, category: true, thresholds: true } } },
    });

    // Deduplicate to latest per category
    const latestStudent = {};
    for (const r of studentResults) {
      if (!latestStudent[r.test.category]) latestStudent[r.test.category] = r;
    }
    const latestParent = {};
    for (const r of parentResults) {
      if (!latestParent[r.test.category]) latestParent[r.test.category] = r;
    }

    // Compute comparison per category
    const categories = [...new Set([...Object.keys(latestStudent), ...Object.keys(latestParent)])];
    const comparison = categories.map(cat => {
      const s = latestStudent[cat];
      const p = latestParent[cat];
      const diff = s && p ? Math.abs(Math.round((s.score / s.maxScore - p.score / p.maxScore) * 100)) : null;

      // Understanding Index
      let understandingIndex = null;
      let indexDesc = null;
      if (diff !== null) {
        if (diff <= 5) {
          understandingIndex = 'STRONG';
          indexDesc = 'Strong Understanding — You and your child see things very similarly.';
        } else if (diff <= 15) {
          understandingIndex = 'MODERATE';
          indexDesc = 'Moderate Understanding Gap — There are some differences in perception.';
        } else {
          understandingIndex = 'SIGNIFICANT';
          indexDesc = 'Significant Perception Difference — This shows an opportunity for better communication.';
        }
      }

      return {
        category: cat,
        studentScore: s ? { score: s.score, maxScore: s.maxScore, pct: Math.round((s.score / s.maxScore) * 100), severity: s.severity } : null,
        parentScore: p ? { score: p.score, maxScore: p.maxScore, pct: Math.round((p.score / p.maxScore) * 100), severity: p.severity } : null,
        percentageDiff: diff,
        understandingIndex,
        indexDesc,
      };
    });

    res.json({ childId, comparison });
  } catch (err) {
    handleError(res, err, 'getComparisonReport');
  }
}

module.exports = { getDashboard, getChildren, getChildResults, getChildResult, bookAppointment, getAppointments, submitParentPerspective, getComparisonReport };

