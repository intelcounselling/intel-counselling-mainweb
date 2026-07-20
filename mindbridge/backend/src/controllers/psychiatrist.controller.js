const prisma = require('../prisma');
const { sendAppointmentEmail } = require('../services/email.service');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { handleError } = require('../utils/errorHandler');

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(req, res) {
  try {
    const psychiatristId = req.user.id;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 2);

    const [schools, studentCount, unreadAlerts, weekAppointments, upcomingAppointments, recentAlerts] =
      await Promise.all([
        prisma.school.findMany({
          where: { psychiatrists: { some: { id: psychiatristId } } },
          select: { id: true, name: true },
        }),
        prisma.user.count({
          where: {
            role: 'STUDENT',
            school: { psychiatrists: { some: { id: psychiatristId } } },
          },
        }),
        prisma.alert.count({
          where: {
            status: 'UNREAD',
            firedAt: { gte: weekStart },
            student: { school: { psychiatrists: { some: { id: psychiatristId } } } },
          },
        }),
        prisma.appointment.count({
          where: {
            psychiatristId,
            slot: { gte: weekStart },
          },
        }),
        prisma.appointment.findMany({
          where: {
            psychiatristId,
            slot: { gte: now, lte: tomorrow },
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          orderBy: { slot: 'asc' },
          take: 10,
          include: {
            patient: { select: { firstName: true, lastName: true, grade: true, school: { select: { name: true } } } },
          },
        }),
        prisma.alert.findMany({
          where: {
            status: 'UNREAD',
            student: { school: { psychiatrists: { some: { id: psychiatristId } } } },
          },
          take: 10,
          orderBy: [{ severity: 'desc' }, { firedAt: 'desc' }],
          include: {
            student: {
              select: {
                id: true, firstName: true, lastName: true,
                school: { select: { name: true } },
              },
            },
          },
        }),
      ]);

    res.json({
      stats: {
        totalSchools: schools.length,
        totalStudents: studentCount,
        unreadAlerts,
        weekAppointments,
      },
      schools,
      recentAlerts,
      upcomingAppointments,
    });
  } catch (err) {
    handleError(res, err);
  }
}

// ── Schools ───────────────────────────────────────────────────

async function getSchools(req, res) {
  try {
    const psychiatristId = req.user.id;
    const schools = await prisma.school.findMany({
      where: { psychiatrists: { some: { id: psychiatristId } } },
      include: {
        _count: { select: { users: true, families: true } },
      },
    });

    // Attach alert counts
    const enriched = await Promise.all(
      schools.map(async (school) => {
        const [alertCount, lastResult] = await Promise.all([
          prisma.alert.count({
            where: { status: 'UNREAD', student: { schoolId: school.id } },
          }),
          prisma.testResult.findFirst({
            where: { student: { schoolId: school.id } },
            orderBy: { takenAt: 'desc' },
            select: { takenAt: true },
          }),
        ]);
        return { ...school, alertCount, lastActivity: lastResult?.takenAt };
      })
    );

    res.json({ schools: enriched });
  } catch (err) {
    handleError(res, err);
  }
}

async function getSchoolStudents(req, res) {
  try {
    const { id: schoolId } = req.params;
    const { skip, take, page, limit } = parsePagination(req.query);

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where: { schoolId, role: 'STUDENT', isActive: true },
        skip,
        take,
        orderBy: { lastName: 'asc' },
        include: {
          testResults: {
            take: 1,
            orderBy: { takenAt: 'desc' },
            include: { test: { select: { name: true } } },
          },
          alerts: {
            where: { status: 'UNREAD' },
            select: { id: true, severity: true },
          },
        },
      }),
      prisma.user.count({ where: { schoolId, role: 'STUDENT' } }),
    ]);

    res.json({ students, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    handleError(res, err);
  }
}

// ── Alerts ────────────────────────────────────────────────────

async function getAlerts(req, res) {
  try {
    const { status, skip, take, page, limit } = { ...parsePagination(req.query), status: req.query.status };
    const psychiatristId = req.user.id;

    const where = {
      student: { school: { psychiatrists: { some: { id: psychiatristId } } } },
      ...(status && { status }),
    };

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        skip,
        take,
        orderBy: [{ severity: 'desc' }, { firedAt: 'desc' }],
        include: {
          student: {
            select: {
              id: true, firstName: true, lastName: true, grade: true,
              school: { select: { name: true } },
            },
          },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    res.json({ alerts, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    handleError(res, err);
  }
}

async function updateAlertStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['READ', 'ACTIONED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const alert = await prisma.alert.update({ where: { id }, data: { status } });
    res.json({ alert });
  } catch (err) {
    handleError(res, err);
  }
}

// ── Appointments ──────────────────────────────────────────────

async function getAppointments(req, res) {
  try {
    const { month, year } = req.query;
    const psychiatristId = req.user.id;

    let dateFilter = {};
    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0);
      dateFilter = { gte: start, lte: end };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        psychiatristId,
        ...(Object.keys(dateFilter).length && { slot: dateFilter }),
      },
      orderBy: { slot: 'asc' },
      include: {
        patient: {
          select: {
            id: true, firstName: true, lastName: true, grade: true,
            school: { select: { name: true } },
          },
        },
        results: {
          include: { test: { select: { name: true, category: true } } },
        },
      },
    });

    res.json({ appointments });
  } catch (err) {
    handleError(res, err);
  }
}

async function createAppointment(req, res) {
  try {
    const { patientId, slot, notes, meetingLink, resultIds } = req.body;
    const psychiatristId = req.user.id;

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        psychiatristId,
        slot: new Date(slot),
        notes,
        meetingLink,
        ...(resultIds?.length && {
          results: { connect: resultIds.map(id => ({ id })) },
        }),
      },
      include: {
        patient: { include: { familyAsStudent: { include: { parents: true } } } },
        psychiatrist: { select: { firstName: true, lastName: true } },
      },
    });

    // Email parents
    const parents = appointment.patient?.familyAsStudent?.parents || [];
    for (const parent of parents) {
      try {
        await sendAppointmentEmail({
          to: parent.email,
          parentName: `${parent.firstName} ${parent.lastName}`,
          studentName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          psychiatristName: `${appointment.psychiatrist.firstName} ${appointment.psychiatrist.lastName}`,
          slot,
          notes,
          meetingLink,
        });
      } catch (e) {}
    }

    res.status(201).json({ appointment });
  } catch (err) {
    handleError(res, err);
  }
}

async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { status, notes, meetingLink, slot } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(meetingLink !== undefined && { meetingLink }),
        ...(slot && { slot: new Date(slot) }),
      },
    });
    res.json({ appointment });
  } catch (err) {
    handleError(res, err);
  }
}

async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    await prisma.appointment.delete({ where: { id } });
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    handleError(res, err);
  }
}

// ── Student Profile ───────────────────────────────────────────

async function getStudentProfile(req, res) {
  try {
    const { id } = req.params;
    const [student, results, alerts, appointments] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        include: { school: true },
      }),
      prisma.testResult.findMany({
        where: { studentId: id },
        orderBy: { takenAt: 'desc' },
        include: { test: { select: { name: true, category: true } } },
      }),
      prisma.alert.findMany({
        where: { studentId: id },
        orderBy: { firedAt: 'desc' },
      }),
      prisma.appointment.findMany({
        where: { patientId: id },
        orderBy: { slot: 'desc' },
        include: {
          psychiatrist: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    if (!student) return res.status(404).json({ error: 'Student not found' });

    res.json({ student, results, alerts, appointments });
  } catch (err) {
    handleError(res, err);
  }
}

// ── Counselling Notes (Package 3) ──────────────────────────────────

async function createNote(req, res) {
  try {
    const counsellorId = req.user.id;
    const { patientId, appointmentId, resultId, sessionDate, summary, goals, nextSteps, isConfidential } = req.body;
    if (!patientId || !sessionDate || !summary) {
      return res.status(400).json({ error: 'patientId, sessionDate, and summary are required' });
    }
    const note = await prisma.counsellingNote.create({
      data: {
        counsellorId,
        patientId,
        appointmentId: appointmentId || null,
        resultId: resultId || null,
        sessionDate: new Date(sessionDate),
        summary,
        goals: goals || null,
        nextSteps: nextSteps || null,
        isConfidential: isConfidential !== undefined ? isConfidential : true,
      },
      include: { counsellor: { select: { firstName: true, lastName: true } } },
    });
    res.status(201).json({ note });
  } catch (err) {
    handleError(res, err, 'createNote');
  }
}

async function getNotes(req, res) {
  try {
    const { patientId } = req.params;
    const notes = await prisma.counsellingNote.findMany({
      where: { patientId },
      orderBy: { sessionDate: 'desc' },
      include: { counsellor: { select: { firstName: true, lastName: true } } },
    });
    res.json({ notes });
  } catch (err) {
    handleError(res, err, 'getNotes');
  }
}

async function updateNote(req, res) {
  try {
    const { noteId } = req.params;
    const { summary, goals, nextSteps, isConfidential } = req.body;
    const note = await prisma.counsellingNote.update({
      where: { id: noteId },
      data: {
        ...(summary && { summary }),
        ...(goals !== undefined && { goals }),
        ...(nextSteps !== undefined && { nextSteps }),
        ...(isConfidential !== undefined && { isConfidential }),
      },
    });
    res.json({ note });
  } catch (err) {
    handleError(res, err, 'updateNote');
  }
}

async function deleteNote(req, res) {
  try {
    const { noteId } = req.params;
    await prisma.counsellingNote.delete({ where: { id: noteId } });
    res.json({ success: true });
  } catch (err) {
    handleError(res, err, 'deleteNote');
  }
}

// ── Student Progress (Package 3) ──────────────────────────────────
// Returns all results for a student grouped by test for before/after comparison

async function getStudentProgress(req, res) {
  try {
    const { id: studentId } = req.params;

    const results = await prisma.testResult.findMany({
      where: { studentId, isParentPerspective: false },
      orderBy: { takenAt: 'asc' },
      include: { test: { select: { name: true, category: true, thresholds: true } } },
    });

    // Group by test category for trend display
    const byCategory = {};
    for (const r of results) {
      const cat = r.test.category;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push({
        id: r.id,
        score: r.score,
        maxScore: r.maxScore,
        severity: r.severity,
        takenAt: r.takenAt,
        subScores: r.subScores,
      });
    }

    const notes = await prisma.counsellingNote.findMany({
      where: { patientId: studentId },
      orderBy: { sessionDate: 'desc' },
      include: { counsellor: { select: { firstName: true, lastName: true } } },
    });

    res.json({ progress: byCategory, notes });
  } catch (err) {
    handleError(res, err, 'getStudentProgress');
  }
}

module.exports = {
  getDashboard,
  getSchools,
  getSchoolStudents,
  getAlerts,
  updateAlertStatus,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getStudentProfile,
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  getStudentProgress,
};
