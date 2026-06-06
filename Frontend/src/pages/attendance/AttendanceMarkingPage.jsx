import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

// --- mock data (replace with real API calls in S2/S3) ---
const MOCK_ENROLLMENTS = [
  { enrollment_id: "enr-1", student_name: "Ali Hassan" },
  { enrollment_id: "enr-2", student_name: "Sara Mohamed" },
  { enrollment_id: "enr-3", student_name: "Omar Khaled" },
];

const todayStr = () => new Date().toISOString().split("T")[0];

export default function AttendanceMarkingPage() {
  const { classId } = useParams();

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [enrollments, setEnrollments] = useState(MOCK_ENROLLMENTS);
  const [attendance, setAttendance] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'danger', message }

  // Initialize attendance state when enrollments load
  useEffect(() => {
    const initial = {};
    enrollments.forEach((e) => {
      initial[e.enrollment_id] = false;
    });
    setAttendance(initial);
  }, [enrollments]);

  // TODO S3: replace with real API call
  // useEffect(() => {
  //   api.get(`/api/enrollments/?class_id=${classId}`)
  //     .then(res => setEnrollments(res.data.results))
  // }, [classId]);

  // TODO S3: check if session exists for selectedDate, pre-fill if so
  // useEffect(() => {
  //   api.get(`/api/sessions/?class_id=${classId}&date=${selectedDate}`)
  //     .then(res => {
  //       if (res.data.results.length > 0) {
  //         const session = res.data.results[0];
  //         setIsEditMode(true);
  //         // load existing attendance records and pre-fill attendance state
  //       } else {
  //         setIsEditMode(false);
  //       }
  //     })
  // }, [classId, selectedDate]);

  const togglePresence = (enrollmentId) => {
    setAttendance((prev) => ({
      ...prev,
      [enrollmentId]: !prev[enrollmentId],
    }));
  };

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

    // TODO S3: replace with real API call
    // try {
    //   await api.post(`/api/sessions/${sessionId}/attendance/`, { records });
    //   showToast("success", isEditMode ? "Attendance updated." : "Attendance saved.");
    // } catch {
    //   showToast("danger", "Failed to save attendance.");
    // } finally {
    //   setSubmitting(false);
    // }

    // Mock success for scaffold
    setTimeout(() => {
      showToast("success", isEditMode ? "Attendance updated." : "Attendance saved.");
      setSubmitting(false);
    }, 600);
  };

  return (
    <div className="container py-4">

      {/* Toast */}
      {toast && (
        <div className={`alert alert-${toast.type} alert-dismissible`} role="alert">
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          Attendance Marking
          {isEditMode && (
            <span className="badge bg-warning text-dark ms-2">Edit Mode</span>
          )}
        </h4>
        <span className="text-muted small">Class ID: {classId}</span>
      </div>

      {/* Date Picker + Notes */}
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

      {/* Attendance Grid */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between">
          <span className="fw-semibold">Students ({enrollments.length})</span>
          <span className="text-muted small">
            Present: {Object.values(attendance).filter(Boolean).length} /  {enrollments.length}
          </span>
        </div>
        <ul className="list-group list-group-flush">
          {enrollments.map((e) => (
            <li
              key={e.enrollment_id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>{e.student_name}</span>
              <div className="d-flex gap-2">
                <button
                  className={`btn btn-sm ${
                    attendance[e.enrollment_id] ? "btn-success" : "btn-outline-success"
                  }`}
                  onClick={() =>
                    setAttendance((prev) => ({ ...prev, [e.enrollment_id]: true }))
                  }
                >
                  Present
                </button>
                <button
                  className={`btn btn-sm ${
                    !attendance[e.enrollment_id] ? "btn-danger" : "btn-outline-danger"
                  }`}
                  onClick={() =>
                    setAttendance((prev) => ({ ...prev, [e.enrollment_id]: false }))
                  }
                >
                  Absent
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Submit */}
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