const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const { validateCreateSchool, validateUUID } = require('../middleware/validation.middleware');
const ctrl = require('../controllers/admin.controller');

const checkSchoolAccess = (req, res, next) => {
  if (req.user.role === 'SCHOOL_ADMIN' && req.params.id && req.params.id !== req.user.schoolId) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

const superAdmin = [verifyToken, requireRole('SUPER_ADMIN')];
const admin = [verifyToken, requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), checkSchoolAccess];
// For routes where :id is a USER id (not a school id) — the controllers
// enforce per-record school ownership themselves.
const adminNoSchoolCheck = [verifyToken, requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN')];

router.get('/dashboard', ...admin, ctrl.getDashboard);
router.get('/severe-no-appt', ...admin, ctrl.getSevereNoAppointment);

// Schools
router.get('/schools', ...admin, ctrl.getSchools);
router.post('/schools', ...superAdmin, upload.single('logo'), validateCreateSchool, ctrl.createSchool);
router.get('/schools/:id', ...admin, validateUUID('id'), ctrl.getSchoolDetail);
router.put('/schools/:id', ...admin, upload.single('logo'), validateUUID('id'), ctrl.updateSchool);
router.delete('/schools/:id', ...superAdmin, validateUUID('id'), ctrl.deleteSchool);
router.get('/schools/:id/students', ...admin, validateUUID('id'), ctrl.getSchoolStudents);
router.post('/schools/:id/family', ...admin, validateUUID('id'), ctrl.createFamily);
router.post('/schools/:id/generate-credentials', ...admin, validateUUID('id'), upload.single('csv'), ctrl.generateBulkCredentials);

// School Analytics Dashboard (Package 1)
router.get('/schools/:id/analytics', ...admin, validateUUID('id'), ctrl.getSchoolAnalytics);

// Class Management
router.get('/schools/:id/classes', ...admin, validateUUID('id'), ctrl.getClasses);
router.post('/schools/:id/classes', ...admin, validateUUID('id'), ctrl.createClass);
router.put('/schools/:id/classes/:classId', ...admin, ctrl.updateClass);
router.delete('/schools/:id/classes/:classId', ...admin, ctrl.deleteClass);
router.post('/schools/:id/classes/:classId/assign', ...admin, ctrl.assignStudentToClass);
router.post('/schools/:id/classes/:classId/unassign', ...admin, ctrl.removeStudentFromClass);
router.post('/schools/:id/classes/:classId/students', ...admin, ctrl.createStudentInClass);

// Users
router.get('/users', ...admin, ctrl.getUsers);
router.post('/users/batch-delete', ...admin, ctrl.batchDeleteUsers);
router.put('/users/:id/toggle-active', ...adminNoSchoolCheck, validateUUID('id'), ctrl.toggleUserActive);
router.post('/users/:id/reset-password', ...adminNoSchoolCheck, validateUUID('id'), ctrl.resetUserPassword);
router.delete('/users/:id', ...adminNoSchoolCheck, validateUUID('id'), ctrl.deleteUser);
router.get('/students/:id/pdf-report', ...superAdmin, validateUUID('id'), ctrl.downloadStudentPDFReport);

// Alerts
router.put('/alerts/:id/resolve', ...admin, validateUUID('id'), ctrl.resolveAlert);

// Admin Appointments
router.get('/appointments', ...admin, ctrl.getAdminAppointments);
router.post('/appointments', ...admin, ctrl.createAdminAppointment);
router.get('/appointment-students', ...admin, ctrl.getStudentsForAppointment);
router.get('/students/:id/history', ...admin, validateUUID('id'), ctrl.getStudentTestHistory);

module.exports = router;
