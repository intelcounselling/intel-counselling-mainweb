// Who may see a student's individual results (students are told this on the test page):
//   - the student, always
//   - their parents (guardians who consented on the child's behalf)
//   - the counsellor: only results the student chose to share, plus any result that
//     flagged a risk — that one reaches the counsellor for the student's safety
//   - school admins: never individual results, only school-wide aggregates

const STAFF_VISIBLE = { OR: [{ sharedWithTherapist: true }, { isLow: true }] };
const NONE = { id: { in: [] } };

const isSchoolAdmin = (req) => req.user?.role === 'SCHOOL_ADMIN';

// `where` for individual results in a staff view
const staffResultsWhere = (req) => (isSchoolAdmin(req) ? NONE : STAFF_VISIBLE);

// `where` for per-student alerts in a staff view (school admins don't see them)
const staffAlertsWhere = (req, extra = {}) => (isSchoolAdmin(req) ? NONE : extra);

module.exports = { STAFF_VISIBLE, isSchoolAdmin, staffResultsWhere, staffAlertsWhere };
