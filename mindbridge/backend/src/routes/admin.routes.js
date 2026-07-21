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

router.get('/dashboard', ...admin, ctrl.getDashboard);

// Schools
router.get('/schools', ...admin, ctrl.getSchools);
router.post('/schools', ...superAdmin, upload.single('logo'), validateCreateSchool, ctrl.createSchool);
router.get('/schools/:id', ...admin, validateUUID('id'), ctrl.getSchoolDetail);
router.put('/schools/:id', ...admin, upload.single('logo'), validateUUID('id'), ctrl.updateSchool);
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

// Users
router.get('/users', ...admin, ctrl.getUsers);
router.put('/users/:id/toggle-active', ...admin, validateUUID('id'), ctrl.toggleUserActive);
router.post('/users/:id/reset-password', ...admin, validateUUID('id'), ctrl.resetUserPassword);
router.delete('/users/:id', ...admin, validateUUID('id'), ctrl.deleteUser);

module.exports = router;
