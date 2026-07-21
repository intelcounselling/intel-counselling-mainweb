const prisma = require('../prisma');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { generateCredentials, regeneratePassword, syncUserToFirebase, updateFirebasePassword, deleteFirebaseUser } = require('../services/credential.service');
const { sendCredentialsEmail } = require('../services/email.service');
const logger = require('../utils/logger');
const { handleError } = require('../utils/errorHandler');
const crypto = require('crypto');

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(req, res) {
  try {
    const [
      totalSchools,
      totalStudents,
      totalParents,
      alertsThisMonth,
      recentAlerts,
    ] = await Promise.all([
      prisma.school.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { role: 'PARENT', isActive: true } }),
      prisma.alert.count({
        where: { firedAt: { gte: new Date(new Date().setDate(1)) } },
      }),
      prisma.alert.findMany({
        take: 5,
        orderBy: { firedAt: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true, school: { select: { name: true } } } },
        },
      }),
    ]);

    res.json({
      stats: { totalSchools, totalStudents, totalParents, alertsThisMonth },
      recentAlerts,
    });
  } catch (err) {
    handleError(res, err, 'getDashboard');
  }
}

// ── Schools ───────────────────────────────────────────────────

async function createSchool(req, res) {
  try {
    const { name, address, adminFirstName, adminLastName, adminEmail, adminPhone } = req.body;
    if (!name || !adminFirstName || !adminLastName || !adminEmail) {
      return res.status(400).json({ error: 'Name, admin first name, last name, and email are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Admin email is already in use by another user' });
    }

    // Generate unique 6-char access code
    let accessCode;
    let unique = false;
    while (!unique) {
      accessCode = generateAccessCode();
      const existing = await prisma.school.findUnique({ where: { accessCode } });
      if (!existing) unique = true;
    }

    const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null;
    const { plainPassword, passwordHash } = await regeneratePassword();

    const [school, user] = await prisma.$transaction(async (tx) => {
      const sch = await tx.school.create({
        data: {
          name,
          address,
          contactEmail: adminEmail,
          contactPhone: adminPhone || null,
          accessCode,
          logoUrl
        },
      });

      const usr = await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: 'SCHOOL_ADMIN',
          firstName: adminFirstName,
          lastName: adminLastName,
          phone: adminPhone || null,
          school: { connect: { id: sch.id } },
          mustResetPassword: true,
          isOnboarded: false,
        }
      });

      return [sch, usr];
    });

    await syncUserToFirebase(adminEmail, plainPassword, `${adminFirstName} ${adminLastName}`);

    res.status(201).json({ school, adminEmail, plainPassword });
  } catch (err) {
    logger.error('createSchool error:', err);
    res.status(500).json({ error: `${err.message} -- STACK: ${err.stack}` });
  }
}

async function getSchools(req, res) {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, families: true } },
        },
      }),
      prisma.school.count(),
    ]);
    res.json({ schools, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    handleError(res, err, 'getSchools');
  }
}

async function updateSchool(req, res) {
  try {
    const { id } = req.params;
    const { name, address, contactEmail, contactPhone, isActive } = req.body;
    const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : undefined;

    const school = await prisma.school.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(contactEmail && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(isActive !== undefined && { isActive }),
        ...(logoUrl && { logoUrl }),
      },
    });
    res.json({ school });
  } catch (err) {
    handleError(res, err, 'updateSchool');
  }
}

async function getSchoolStudents(req, res) {
  try {
    const { id } = req.params;
    const { skip, take, page, limit } = parsePagination(req.query);

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where: { schoolId: id, role: 'STUDENT' },
        skip,
        take,
        orderBy: { lastName: 'asc' },
        include: {
          testResults: {
            take: 1,
            orderBy: { takenAt: 'desc' },
            include: { test: { select: { name: true } } },
          },
          _count: { select: { alerts: true } },
        },
      }),
      prisma.user.count({ where: { schoolId: id, role: 'STUDENT' } }),
    ]);

    res.json({ students, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    handleError(res, err, 'getSchoolStudents');
  }
}

// ── Family Creation ───────────────────────────────────────────

async function createFamily(req, res) {
  try {
    const { id: schoolId } = req.params;
    const { students: studentData, parents: parentData } = req.body;

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return res.status(404).json({ error: 'School not found' });

    const generatedCredentials = [];

    const family = await prisma.family.create({ data: { schoolId } });

    // Create students
    for (const s of studentData) {
      let email = s.email?.trim().toLowerCase();
      if (email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: `Email ${email} is already registered` });
      }

      const creds = await generateCredentials(s.firstName, s.lastName, school.accessCode);
      const studentEmail = email || creds.email;

      const student = await prisma.user.create({
        data: {
          email: studentEmail,
          passwordHash: creds.passwordHash,
          role: 'STUDENT',
          firstName: s.firstName,
          lastName: s.lastName,
          grade: s.grade,
          dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : null,
          schoolId,
          familyStudentId: family.id,
          mustResetPassword: true,
        },
      });

      // Sync to Firebase Auth (non-blocking — silently skipped if Firebase not configured)
      syncUserToFirebase(studentEmail, creds.plainPassword, `${s.firstName} ${s.lastName}`).catch(() => {});

      generatedCredentials.push({
        id: student.id,
        name: `${s.firstName} ${s.lastName}`,
        email: studentEmail,
        password: creds.plainPassword,
        role: 'STUDENT',
      });
    }

    // Create parents
    for (const p of parentData) {
      let email = p.email?.trim().toLowerCase();
      if (email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: `Email ${email} is already registered` });
      }

      const creds = await generateCredentials(p.firstName, p.lastName, school.accessCode);
      const parentEmail = email || creds.email;

      const parent = await prisma.user.create({
        data: {
          email: parentEmail,
          passwordHash: creds.passwordHash,
          role: 'PARENT',
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          schoolId,
          familyParentId: family.id,
          mustResetPassword: true,
        },
      });

      // Sync to Firebase Auth (non-blocking)
      syncUserToFirebase(parentEmail, creds.plainPassword, `${p.firstName} ${p.lastName}`).catch(() => {});

      generatedCredentials.push({
        id: parent.id,
        name: `${p.firstName} ${p.lastName}`,
        email: parentEmail,
        password: creds.plainPassword,
        role: 'PARENT',
      });
    }

    res.status(201).json({ family, credentials: generatedCredentials });
  } catch (err) {
    handleError(res, err, 'createFamily');
  }
}

// ── Users ─────────────────────────────────────────────────────

async function getUsers(req, res) {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const { role, schoolId, isActive, search } = req.query;

    const where = {
      role: (role && role !== 'SUPER_ADMIN') ? role : { not: 'SUPER_ADMIN' },
      schoolId: req.user.role === 'SCHOOL_ADMIN' ? req.user.schoolId : (schoolId || undefined),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          phone: true,
          grade: true,
          isActive: true,
          mustResetPassword: true,
          createdAt: true,
          school: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    handleError(res, err, 'getUsers');
  }
}

async function toggleUserActive(req, res) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super Admin users cannot be deactivated' });
    }

    if (req.user.role === 'SCHOOL_ADMIN' && user.schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    res.json({ user: updated });
  } catch (err) {
    handleError(res, err, 'toggleUserActive');
  }
}

async function resetUserPassword(req, res) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super Admin passwords cannot be reset via this endpoint' });
    }

    if (req.user.role === 'SCHOOL_ADMIN' && user.schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { plainPassword, passwordHash } = await regeneratePassword();
    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustResetPassword: true },
    });

    // Keep Firebase password in sync (non-blocking)
    updateFirebasePassword(user.email, plainPassword).catch(() => {});

    res.json({ email: user.email, newPassword: plainPassword });
  } catch (err) {
    handleError(res, err, 'resetUserPassword');
  }
}

// ── Bulk Credentials ──────────────────────────────────────────

async function generateBulkCredentials(req, res) {
  try {
    const { id: schoolId } = req.params;
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return res.status(404).json({ error: 'School not found' });

    if (!req.file) return res.status(400).json({ error: 'CSV file required' });

    const csvContent = require('fs').readFileSync(req.file.path, 'utf8');
    const allLines = csvContent.split('\n').filter(Boolean);
    if (allLines.length < 2) return res.status(400).json({ error: 'CSV file is empty' });

    const headers = allLines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const lines = allLines.slice(1);

    const firstNameIdx = headers.indexOf('first_name');
    const lastNameIdx = headers.indexOf('last_name');
    const roleIdx = headers.indexOf('role');
    const emailIdx = headers.indexOf('email');
    const gradeIdx = headers.indexOf('grade');

    if (firstNameIdx === -1 || lastNameIdx === -1 || roleIdx === -1) {
      return res.status(400).json({ error: 'CSV must contain at least first_name, last_name, and role columns' });
    }

    const results = [];
    const skipped = [];

    for (const line of lines) {
      const cols = line.split(',').map(s => s.trim().replace(/"/g, ''));
      if (cols.length < 3) continue;

      const first_name = cols[firstNameIdx];
      const last_name = cols[lastNameIdx];
      const role = cols[roleIdx];
      if (!first_name || !last_name || !role) continue;

      const validRole = ['STUDENT', 'PARENT', 'PSYCHIATRIST'].includes(role.toUpperCase());
      if (!validRole) continue;

      const grade = gradeIdx !== -1 ? cols[gradeIdx] : null;
      let email = emailIdx !== -1 ? cols[emailIdx]?.trim().toLowerCase() : null;

      const creds = await generateCredentials(first_name, last_name, school.accessCode);
      const userEmail = email || creds.email;

      if (userEmail) {
        const existing = await prisma.user.findUnique({ where: { email: userEmail } });
        if (existing) {
          skipped.push({ name: `${first_name} ${last_name}`, email: userEmail, reason: 'Email already registered' });
          continue;
        }
      }

      const user = await prisma.user.create({
        data: {
          email: userEmail,
          passwordHash: creds.passwordHash,
          role: role.toUpperCase(),
          firstName: first_name,
          lastName: last_name,
          grade: grade || null,
          schoolId,
          mustResetPassword: true,
        },
      });

      // Sync to Firebase Auth (non-blocking)
      syncUserToFirebase(userEmail, creds.plainPassword, `${first_name} ${last_name}`).catch(() => {});

      results.push({ name: `${first_name} ${last_name}`, email: userEmail, password: creds.plainPassword, role: role.toUpperCase() });
    }

    res.json({ generated: results.length, credentials: results, skipped });
  } catch (err) {
    handleError(res, err, 'generateBulkCredentials');
  }
}

// ── School Detail ─────────────────────────────────────────────

async function getSchoolDetail(req, res) {
  try {
    const { id } = req.params;
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, families: true, classes: true } },
        classes: { orderBy: { grade: 'asc' } },
      },
    });
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json({ school });
  } catch (err) {
    handleError(res, err, 'getSchoolDetail');
  }
}

// ── Class Management ──────────────────────────────────────────

async function createClass(req, res) {
  try {
    const { id: schoolId } = req.params;
    const { name, grade, section } = req.body;
    if (!name || !grade) return res.status(400).json({ error: 'Class name and grade required' });
    const cls = await prisma.class.create({ data: { schoolId, name, grade, section } });
    res.status(201).json({ class: cls });
  } catch (err) {
    handleError(res, err, 'createClass');
  }
}

async function getClasses(req, res) {
  try {
    const { id: schoolId } = req.params;
    const classes = await prisma.class.findMany({
      where: { schoolId },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
      include: { _count: { select: { students: true } } },
    });
    res.json({ classes });
  } catch (err) {
    handleError(res, err, 'getClasses');
  }
}

async function updateClass(req, res) {
  try {
    const { classId } = req.params;
    const { name, grade, section } = req.body;
    const cls = await prisma.class.update({
      where: { id: classId },
      data: { ...(name && { name }), ...(grade && { grade }), ...(section !== undefined && { section }) },
    });
    res.json({ class: cls });
  } catch (err) {
    handleError(res, err, 'updateClass');
  }
}

async function deleteClass(req, res) {
  try {
    const { classId } = req.params;
    await prisma.class.delete({ where: { id: classId } });
    res.json({ success: true });
  } catch (err) {
    handleError(res, err, 'deleteClass');
  }
}

async function assignStudentToClass(req, res) {
  try {
    const { classId } = req.params;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });
    await prisma.user.update({ where: { id: studentId }, data: { classId } });
    res.json({ success: true });
  } catch (err) {
    handleError(res, err, 'assignStudentToClass');
  }
}

// ── School Analytics Dashboard (Package 1) ────────────────────
// Returns group-level analytics. Emotional Wellness returns only % groups.

async function getSchoolAnalytics(req, res) {
  try {
    const { id: schoolId } = req.params;
    const { classId } = req.query;

    // Base student filter
    const studentFilter = {
      role: 'STUDENT',
      schoolId,
      isActive: true,
      ...(classId && { classId }),
    };

    const [school, totalStudents, studentsWithResults, classes] = await Promise.all([
      prisma.school.findUnique({ where: { id: schoolId }, select: { name: true, package: true } }),
      prisma.user.count({ where: studentFilter }),
      prisma.user.count({ where: { ...studentFilter, testResults: { some: {} } } }),
      prisma.class.findMany({
        where: { schoolId },
        include: { _count: { select: { students: true } } },
        orderBy: { grade: 'asc' },
      }),
    ]);

    if (!school) return res.status(404).json({ error: 'School not found' });

    // Get all ISSS test definitions
    const tests = await prisma.test.findMany({
      where: { isActive: true, category: { in: ['LearningPattern', 'StudyBehaviour', 'EmotionalWellness', 'InternetUsage', 'PersonalityDimensions'] } },
      select: { id: true, category: true, isSensitive: true, thresholds: true },
    });

    // Get all test results for students in this school (latest per student per test)
    const allResults = await prisma.testResult.findMany({
      where: {
        student: studentFilter,
        isParentPerspective: false,
        test: { category: { in: ['LearningPattern', 'StudyBehaviour', 'EmotionalWellness', 'InternetUsage', 'PersonalityDimensions'] } },
      },
      orderBy: { takenAt: 'desc' },
      include: { test: { select: { category: true, thresholds: true, isSensitive: true } } },
    });

    // Reduce to latest result per student per category
    const latestResults = {};
    for (const r of allResults) {
      const key = `${r.studentId}_${r.test.category}`;
      if (!latestResults[key]) latestResults[key] = r;
    }
    const latestList = Object.values(latestResults);

    // Helper: compute severity band distribution
    function computeBandDistribution(results, thresholds) {
      const total = results.length;
      if (total === 0) return [];
      return thresholds.map(band => {
        const count = results.filter(r => r.score >= band.min && r.score <= band.max).length;
        return { label: band.label, count, percentage: Math.round((count / total) * 100) };
      });
    }

    // Per-category analytics
    const byCategory = {};
    for (const test of tests) {
      const catResults = latestList.filter(r => r.test.category === test.category);
      const thresholds = test.thresholds;
      byCategory[test.category] = {
        total: catResults.length,
        distribution: computeBandDistribution(catResults, thresholds),
        // Sub-scores only for categories that have them (LearningPattern, PersonalityDimensions)
        subScores: catResults.length > 0 ? computeAverageSubScores(catResults) : null,
      };
    }

    // Counselling planning: count students in "needs support" bands
    const counsellingNeeds = {
      academicSupport: 0, emotionalSupport: 0, digitalBalance: 0, confidenceBuilding: 0,
    };

    for (const r of latestList) {
      const threshold = r.test.thresholds;
      if (!Array.isArray(threshold)) continue;
      // Find matching band
      const band = threshold.find(b => r.score >= b.min && r.score <= b.max);
      if (!band) continue;
      // Map categories to counselling needs
      switch (r.test.category) {
        case 'StudyBehaviour':
          if (band.severity === 'severe' || band.severity === 'moderate') counsellingNeeds.academicSupport++;
          break;
        case 'EmotionalWellness':
          if (band.severity === 'severe' || band.severity === 'moderate') counsellingNeeds.emotionalSupport++;
          break;
        case 'InternetUsage':
          if (band.severity === 'severe' || band.severity === 'moderate') counsellingNeeds.digitalBalance++;
          break;
        case 'PersonalityDimensions':
          if (band.severity === 'moderate') counsellingNeeds.confidenceBuilding++;
          break;
      }
    }

    res.json({
      school,
      completion: { total: totalStudents, completed: studentsWithResults, pending: totalStudents - studentsWithResults },
      classes,
      analytics: byCategory,
      counsellingNeeds,
    });
  } catch (err) {
    handleError(res, err, 'getSchoolAnalytics');
  }
}

function computeAverageSubScores(results) {
  const totals = {};
  const counts = {};
  for (const r of results) {
    if (!r.subScores || typeof r.subScores !== 'object') continue;
    for (const [dim, val] of Object.entries(r.subScores)) {
      totals[dim] = (totals[dim] || 0) + (val || 0);
      counts[dim] = (counts[dim] || 0) + 1;
    }
  }
  const avg = {};
  for (const dim of Object.keys(totals)) {
    avg[dim] = Math.round(totals[dim] / counts[dim]);
  }
  return Object.keys(avg).length > 0 ? avg : null;
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super Admin users cannot be deleted' });
    }

    if (req.user.role === 'SCHOOL_ADMIN' && user.schoolId !== req.user.schoolId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Remove from Firebase Auth (non-blocking, before DB delete so we still have the email)
    deleteFirebaseUser(user.email).catch(() => {});

    // Clean up dependent tables first
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: id } }),
      prisma.alert.deleteMany({ where: { studentId: id } }),
      prisma.concern.deleteMany({ where: { studentId: id } }),
      prisma.appointment.deleteMany({ where: { OR: [{ patientId: id }, { psychiatristId: id }] } }),
      prisma.counsellingNote.deleteMany({ where: { OR: [{ patientId: id }, { counsellorId: id }] } }),
      prisma.testResult.deleteMany({ where: { studentId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    handleError(res, err, 'deleteUser');
  }
}

async function batchDeleteUsers(req, res) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid user IDs' });
    }

    const idsToDelete = ids.filter(id => id !== req.user.id);
    if (idsToDelete.length === 0) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const usersToDelete = await prisma.user.findMany({
      where: { id: { in: idsToDelete } }
    });

    if (usersToDelete.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }

    for (const u of usersToDelete) {
      if (u.role === 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Super Admin users cannot be deleted' });
      }
      if (req.user.role === 'SCHOOL_ADMIN' && u.schoolId !== req.user.schoolId) {
        return res.status(403).json({ error: 'Insufficient permissions to delete users from another school' });
      }
    }

    const userEmails = usersToDelete.map(u => u.email);
    for (const email of userEmails) {
      deleteFirebaseUser(email).catch(() => {});
    }

    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: { in: idsToDelete } } }),
      prisma.alert.deleteMany({ where: { studentId: { in: idsToDelete } } }),
      prisma.concern.deleteMany({ where: { studentId: { in: idsToDelete } } }),
      prisma.appointment.deleteMany({ where: { OR: [{ patientId: { in: idsToDelete } }, { psychiatristId: { in: idsToDelete } }] } }),
      prisma.counsellingNote.deleteMany({ where: { OR: [{ patientId: { in: idsToDelete } }, { counsellorId: { in: idsToDelete } }] } }),
      prisma.testResult.deleteMany({ where: { studentId: { in: idsToDelete } } }),
      prisma.user.deleteMany({ where: { id: { in: idsToDelete } } }),
    ]);

    res.json({ success: true, message: `${idsToDelete.length} user(s) deleted successfully` });
  } catch (err) {
    handleError(res, err, 'batchDeleteUsers');
  }
}

async function deleteSchool(req, res) {
  try {
    const { id } = req.params;

    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) return res.status(404).json({ error: 'School not found' });

    const usersInSchool = await prisma.user.findMany({ where: { schoolId: id } });
    const userIds = usersInSchool.map(u => u.id);
    const userEmails = usersInSchool.map(u => u.email);

    for (const email of userEmails) {
      deleteFirebaseUser(email).catch(() => {});
    }

    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.alert.deleteMany({ where: { studentId: { in: userIds } } }),
      prisma.concern.deleteMany({ where: { studentId: { in: userIds } } }),
      prisma.appointment.deleteMany({ where: { OR: [{ patientId: { in: userIds } }, { psychiatristId: { in: userIds } }] } }),
      prisma.counsellingNote.deleteMany({ where: { OR: [{ patientId: { in: userIds } }, { counsellorId: { in: userIds } }] } }),
      prisma.testResult.deleteMany({ where: { studentId: { in: userIds } } }),
      prisma.class.deleteMany({ where: { schoolId: id } }),
      prisma.family.deleteMany({ where: { schoolId: id } }),
      prisma.user.deleteMany({ where: { schoolId: id } }),
      prisma.school.delete({ where: { id } }),
    ]);

    res.json({ success: true, message: 'School and all associated data deleted successfully' });
  } catch (err) {
    handleError(res, err, 'deleteSchool');
  }
}

// ── Helper ────────────────────────────────────────────────────

function generateAccessCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}

module.exports = {
  getDashboard,
  createSchool,
  getSchools,
  getSchoolDetail,
  updateSchool,
  getSchoolStudents,
  getSchoolAnalytics,
  createFamily,
  createClass,
  getClasses,
  updateClass,
  deleteClass,
  assignStudentToClass,
  getUsers,
  toggleUserActive,
  resetUserPassword,
  generateBulkCredentials,
  deleteUser,
  batchDeleteUsers,
  deleteSchool,
};
