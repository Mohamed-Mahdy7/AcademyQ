import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import AttendanceToast from "../../components/attendance/AttendanceToast";
import SessionControls from "../../components/attendance/SessionControls";
import StudentAttendanceGrid from "../../components/attendance/StudentAttendanceGrid";

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

  const handleToggle = (enrollmentId, value) => {
    setAttendance(prev => ({ ...prev, [enrollmentId]: value }));
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
          class_obj: classId,
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
    <div className="page-body">
      <AttendanceToast toast={toast} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-1">Attendance Marking</h1>
          <p className="subheading">Class ID: {classId}</p>
        </div>
        {isEditMode && (
          <span className="badge-warning">Edit Mode</span>
        )}
      </div>

      <SessionControls
        selectedDate={selectedDate}
        notes={notes}
        onDateChange={setSelectedDate}
        onNotesChange={setNotes}
      />

      <StudentAttendanceGrid
        enrollments={enrollments}
        attendance={attendance}
        onToggle={handleToggle}
        onSubmit={handleSubmit}
        submitting={submitting}
        isEditMode={isEditMode}
      />
    </div>
  );
}