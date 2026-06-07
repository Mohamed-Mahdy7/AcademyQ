import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

const todayStr = () => new Date().toISOString().split("T")[0];

export default function AttendanceMarkingPage() {
  const { classId } = useParams();

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Load enrollments once on mount
  useEffect(() => {
    api.get(`/api/enrollments/?class_id=${classId}`)
      .then(res => {
        const data = res.data.results ?? res.data;
        setEnrollments(data);
        const initial = {};
        data.forEach(e => { initial[e.id] = false; });
        setAttendance(initial);
      })
      .catch(() => showToast("danger", "Failed to load students."));
  }, [classId]);

  // Check if session exists for selected date, pre-fill if so
  useEffect(() => {
    if (!classId || !selectedDate) return;

    api.get(`/api/sessions/?class_id=${classId}`)
      .then(res => {
        const data = res.data.results ?? res.data;
        const existing = data.find(s => s.session_date === selectedDate);

        if (existing) {
          setSessionId(existing.id);
          setIsEditMode(true);
          setNotes(existing.notes || "");
          return api.get(`/api/sessions/${existing.id}/attendance/`);
        } else {
          setSessionId(null);
          setIsEditMode(false);
          setNotes("");
          return null;
        }
      })
      .then(res => {
        if (!res) return;
        const data = res.data.results ?? res.data;
        const prefilled = {};
        data.forEach(r => { prefilled[r.enrollment] = r.present; });
        setAttendance(prev => ({ ...prev, ...prefilled }));
      })
      .catch(() => showToast("danger", "Failed to check session."));
  }, [classId, selectedDate]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const records = Object.entries(attendance).map(([enrollment_id, present]) => ({
      enrollment_id,
      present,
    }));

    try {
      let activeSessionId = sessionId;

      if (!activeSessionId) {
        const sessionRes = await api.post(`/api/sessions/`, {
          class_id: classId,
          session_date: selectedDate,
          notes,
        });
        activeSessionId = sessionRes.data.id;
        setSessionId(activeSessionId);
      }

      await api.post(`/api/sessions/${activeSessionId}/attendance/`, { records });
      showToast("success", isEditMode ? "Attendance updated." : "Attendance saved.");
    } catch {
      showToast("danger", "Failed to save attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4">

      {toast && (
        <div className={`alert alert-${toast.type} alert-dismissible`} role="alert">
          {toast.message}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          Attendance Marking
          {isEditMode && (
            <span className="badge bg-warning text-dark ms-2">Edit Mode</span>
          )}
        </h4>
        <span className="text-muted small">Class ID: {classId}</span>
      </div>

      <div className="card mb-4">
        <div className="card-body row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Session Date</label>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="col-md-8">
            <label className="form-label fw-semibold">Session Notes</label>
            <input
              type="text"
              className="form-control"
              placeholder="Optional notes for this session..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between">
          <span className="fw-semibold">Students ({enrollments.length})</span>
          <span className="text-muted small">
            Present: {Object.values(attendance).filter(Boolean).length} / {enrollments.length}
          </span>
        </div>
        <ul className="list-group list-group-flush">
          {enrollments.map((e) => (
            <li
              key={e.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>{e.student_name}</span>
              <div className="d-flex gap-2">
                <button
                  className={`btn btn-sm ${attendance[e.id] ? "btn-success" : "btn-outline-success"}`}
                  onClick={() => setAttendance(prev => ({ ...prev, [e.id]: true }))}
                >
                  Present
                </button>
                <button
                  className={`btn btn-sm ${!attendance[e.id] ? "btn-danger" : "btn-outline-danger"}`}
                  onClick={() => setAttendance(prev => ({ ...prev, [e.id]: false }))}
                >
                  Absent
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button
        className="btn btn-primary px-4"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Saving...
          </>
        ) : isEditMode ? "Update Attendance" : "Save Attendance"}
      </button>

    </div>
  );
}