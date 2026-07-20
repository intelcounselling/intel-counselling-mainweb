const prisma = require('../prisma');
const emailService = require('./email.service');
const logger = require('../utils/logger');

/**
 * Create an alert for a student's low test result,
 * notify the assigned psychiatrist via email,
 * and notify the parent via email if address is available.
 */
async function createAlertAndNotify({ studentId, resultId, severity, testName, score, maxScore }) {
  // 1. Get student with school and family info
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      school: true,
      familyAsStudent: {
        include: {
          parents: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
      },
    },
  });

  if (!student) {
    logger.error(`Alert: Student not found: ${studentId}`);
    return null;
  }

  const message = `${student.firstName} ${student.lastName} scored ${score}/${maxScore} on ${testName}, indicating ${severity} level. Immediate review recommended.`;

  // 2. Save alert to DB
  const alert = await prisma.alert.create({
    data: {
      studentId,
      resultId,
      severity,
      message,
    },
  });

  logger.info(`Alert created: ${alert.id} for student ${studentId}`);

  // 3. Find psychiatrist(s) assigned to the school
  if (student.schoolId) {
    const psychiatrists = await prisma.user.findMany({
      where: {
        role: 'PSYCHIATRIST',
        assignedSchools: { some: { id: student.schoolId } },
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    // 4. Email each psychiatrist
    for (const psych of psychiatrists) {
      try {
        await emailService.sendAlertEmail({
          to: psych.email,
          psychiatristName: `${psych.firstName} ${psych.lastName}`,
          studentName: `${student.firstName} ${student.lastName}`,
          testName,
          score,
          maxScore,
          severity,
          schoolName: student.school?.name || 'Unknown School',
        });
      } catch (err) {
        logger.error(`Failed to email psychiatrist ${psych.email}:`, err);
      }
    }
  }

  // 5. Email parent(s)
  const parents = student.familyAsStudent?.parents || [];
  for (const parent of parents) {
    if (parent.email) {
      try {
        await emailService.sendParentAlertEmail({
          to: parent.email,
          parentName: `${parent.firstName} ${parent.lastName}`,
          studentName: `${student.firstName} ${student.lastName}`,
          testName,
        });
      } catch (err) {
        logger.error(`Failed to email parent ${parent.email}:`, err);
      }
    }
  }

  // 6. Notify admin (intelconselling@gmail.com)
  try {
    await emailService.sendAlertEmail({
      to: 'intelconselling@gmail.com',
      psychiatristName: 'Admin',
      studentName: `${student.firstName} ${student.lastName}`,
      testName,
      score,
      maxScore,
      severity,
      schoolName: student.school?.name || 'Unknown School',
    });
  } catch (err) {
    logger.error('Failed to email admin intelconselling@gmail.com:', err);
  }

  return alert;
}

module.exports = { createAlertAndNotify };
