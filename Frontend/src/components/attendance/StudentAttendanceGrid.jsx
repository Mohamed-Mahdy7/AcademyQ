export default function StudentAttendanceGrid({ enrollments, attendance, onToggle, onSubmit, submitting, isEditMode }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-header-title">Students</h3>
        <div className="flex items-center gap-3">
          <span className="badge-count">
            {Object.values(attendance).filter(Boolean).length} / {enrollments.length} Present
          </span>
          <button
            className="btn-primary"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="btn-spinner" />
                Saving...
              </>
            ) : isEditMode ? "Update Attendance" : "Save Attendance"}
          </button>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No students enrolled</div>
          <div className="empty-state-desc">No students found for this class.</div>
        </div>
      ) : (
        <ul>
          {enrollments.map((e) => (
            <li key={e.id} className="attendance-row">
              <span className="attendance-name">{e.student_name}</span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  className={attendance[e.id] ? "attendance-toggle-present" : "attendance-toggle-inactive"}
                  onClick={() => onToggle(e.id, true)}
                >
                  Present
                </button>
                <button
                  className={!attendance[e.id] ? "attendance-toggle-absent" : "attendance-toggle-inactive"}
                  onClick={() => onToggle(e.id, false)}
                >
                  Absent
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}