const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/psychiatrist.controller');

const psych = [verifyToken, requireRole('PSYCHIATRIST', 'SUPER_ADMIN')];

router.get('/dashboard', ...psych, ctrl.getDashboard);
router.get('/schools', ...psych, ctrl.getSchools);
router.get('/schools/:id/students', ...psych, ctrl.getSchoolStudents);
router.get('/alerts', ...psych, ctrl.getAlerts);
router.put('/alerts/:id/status', ...psych, ctrl.updateAlertStatus);
router.get('/appointments', ...psych, ctrl.getAppointments);
router.post('/appointments', ...psych, ctrl.createAppointment);
router.put('/appointments/:id', ...psych, ctrl.updateAppointment);
router.delete('/appointments/:id', ...psych, ctrl.deleteAppointment);
router.get('/students/:id', ...psych, ctrl.getStudentProfile);

// Counselling Notes (Package 3)
router.post('/notes', ...psych, ctrl.createNote);
router.get('/notes/:patientId', ...psych, ctrl.getNotes);
router.put('/notes/:noteId', ...psych, ctrl.updateNote);
router.delete('/notes/:noteId', ...psych, ctrl.deleteNote);

// Student Progress (Package 3)
router.get('/students/:id/progress', ...psych, ctrl.getStudentProgress);

module.exports = router;
