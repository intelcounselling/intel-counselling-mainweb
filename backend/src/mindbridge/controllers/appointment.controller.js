const prisma = require('../prisma');
const { generateSessionReport } = require('../services/pdf.service');
const { handleError } = require('../utils/errorHandler');

async function getReport(req, res) {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { school: true } },
        psychiatrist: { select: { firstName: true, lastName: true } },
        results: {
          include: { test: { select: { name: true, category: true } } },
        },
      },
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    // Authorization: patient's parent or psychiatrist
    const userId = req.user.id;
    const isOwner = appointment.psychiatristId === userId || appointment.patientId === userId;

    // Check if parent
    let isParent = false;
    if (!isOwner && req.user.role === 'PARENT') {
      const parent = await prisma.user.findUnique({
        where: { id: userId },
        include: { familyAsParent: { include: { students: { select: { id: true } } } } },
      });
      const childIds = parent?.familyAsParent?.students.map(s => s.id) || [];
      isParent = childIds.includes(appointment.patientId);
    }

    if (!isOwner && !isParent && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await generateSessionReport(res, {
      appointment,
      patient: appointment.patient,
      psychiatrist: appointment.psychiatrist,
      school: appointment.patient?.school,
      results: appointment.results,
    });
  } catch (err) {
    handleError(res, err);
  }
}

module.exports = { getReport };
