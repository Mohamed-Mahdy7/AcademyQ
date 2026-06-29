import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api";
import { getClassSchedule } from "../../services/classService";
import { toast } from "../../lib/toastBus";
import SessionControls from "../../components/attendance/SessionControls";
import StudentAttendanceGrid from "../../components/attendance/StudentAttendanceGrid";

const todayStr = () => new Date().toISOString().split("T")[0];

export default function AttendanceMarkingPage() {
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const dateFromUrl = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState(dateFromUrl || todayStr());
  const [notes, setNotes] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [sessionTime, setSessionTime] = useState('00:00:00');
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classData, setClassData] = useState(null);
  const [currentSessionNum, setCurrentSessionNum] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const sessionIdFromUrl = searchParams.get("session_id");
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/api/enrollments/?class_id=${classId}`)
      .then(res => {
        const data = res.data.results ?? res.data;
        setEnrollments(data);
        setAttendance(prev => {
            const initial = {};
            data.forEach(e => { initial[e.id] = prev[e.id] ?? false; });
            return initial;
        });
      })
      .catch(() => showToast("danger", "Failed to load students."));
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    api.get(`/api/sessions/?class_id=${classId}`)
      .then(res => {
        const data = res.data.results ?? res.data;

        let existing;
        if (sessionIdFromUrl) {
            existing = data.find(s => s.id === sessionIdFromUrl);
        } else if (selectedDate) {
            existing = data.find(s => s.session_date === selectedDate);
        }

        if (existing) {
            setSessionId(existing.id);
            setIsEditMode(true);
            setNotes(existing.notes || "");
            setCurrentSessionNum(existing.session_num);
            setSessionTime(existing.session_time);
            if (sessionIdFromUrl) {
                setSelectedDate(existing.session_date);
            }
            return api.get(`/api/sessions/${existing.id}/attendance/`);
        } else {
            setSessionId(null);
            setIsEditMode(false);
            setNotes("");
            const dateObj = new Date(selectedDate + "T00:00:00");
            const jsDay = dateObj.getDay();
            const pyDay = jsDay === 0 ? 6 : jsDay - 1;
            const matchingSlot = schedules.find(s => s.day_of_week === pyDay);
            setSessionTime(matchingSlot ? matchingSlot.start_time : '00:00:00');
            return null;
        }
      })
      .then(res => {
        if (!res) return;
        const data = res.data.results ?? res.data;
        const prefilled = {};
        data.forEach(r => { prefilled[r.enrollment] = r.present; });
        setAttendance(prev => {
            const initial = {};
            Object.keys(prev).forEach(k => { initial[k] = prefilled[k] ?? false; });
            return { ...initial, ...prefilled };
        });
      })
      .catch(() => showToast("danger", "Failed to check session."));
}, [classId, selectedDate, schedules, sessionIdFromUrl]);

  useEffect(() => {
      api.get(`/api/classes/${classId}/`)
          .then(res => setClassData(res.data))
          .catch(() => {});
  }, [classId]);

  useEffect(() => {
    getClassSchedule(classId)
      .then(res => {
        setSchedules(res.data);
      })
      .catch((err) => console.log("schedule fetch failed:", err));
  }, [classId]);

  const showToast = (type, message) => {
    if (type === "success") toast.success("Success", message);
    else if (type === "warning") toast.warning("Warning", message);
    else toast.danger("Error", message);
  };

  const handleToggle = (enrollmentId, value) => {
    setAttendance(prev => ({ ...prev, [enrollmentId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const today = new Date().toISOString().split("T")[0];
    if (selectedDate > today) {
        showToast("warning", "This session has not been conducted yet.");
        setSubmitting(false);
        return;
    }

    const records = Object.entries(attendance).map(([enrollment_id, present]) => ({
        enrollment_id,
        present,
    }));

    try {
        let activeSessionId = sessionId;
        if (!activeSessionId) {
            if (schedules.length > 0) {
                const dateObj = new Date(selectedDate + "T00:00:00");
                const jsDay = dateObj.getDay();
                const pyDay = jsDay === 0 ? 6 : jsDay - 1;
                const matchingSlot = schedules.find(s => s.day_of_week === pyDay);
                if (!matchingSlot) {
                    showToast("warning", "No class scheduled on this day. Choose a day that matches the class timetable.");
                    setSubmitting(false);
                    return;
                }
            }
            const sessionRes = await api.post(`/api/sessions/`, {
                class_ids: [classId],
                session_date: selectedDate,
                session_time: sessionTime,
                notes,
            });
            activeSessionId = sessionRes.data.id;
            setSessionId(activeSessionId);
            setCurrentSessionNum(sessionRes.data.session_num);
        }

        const res = await api.post(
            `/api/sessions/${activeSessionId}/attendance/`,
            { records }
        );

        const { failed } = res.data;
        if (failed && failed.length > 0) {
            const failedNames = failed.map(enrollmentId => {
                const enrollment = enrollments.find(e => e.id === enrollmentId);
                return enrollment?.student_name ?? enrollmentId;
            });
            showToast("warning", `Attendance partially saved. Failed for: ${failedNames.join(", ")}`);
        } else {
            showToast("success", isEditMode ? "Attendance updated." : "Attendance saved.");
        }
    } catch (err) {
        const detail = err.response?.data?.detail || "Failed to save attendance.";
        showToast("danger", detail);
    } finally {
        setSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    setRescheduling(true);
    try {
        await api.patch(`/api/sessions/${sessionId}/`, {
            session_date: selectedDate,
            session_time: sessionTime,
        });
        showToast("success", "Session rescheduled successfully.");
        navigate(`/classes/${classId}/attendance?date=${selectedDate}`);
    } catch (err) {
        const data = err.response?.data;
        const msg = data?.fields?.session?.[0] || data?.fields?.session_date?.[0] || data?.detail || "Failed to reschedule.";
        showToast("danger", msg);
    } finally {
        setRescheduling(false);
    }
  };

  return (
    <div className="page-body">

      <div className="flex items-start gap-3 mb-6 flex-wrap">
          <button className="btn-icon mt-1" onClick={() => navigate(`/classes/${classId}`)}>←</button>
          <div className="flex-1 min-w-0">
              <h1 className="heading-1 truncate">{classData?.name ?? 'Attendance'}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {currentSessionNum && (
                      <span className="text-caption">Session {currentSessionNum}</span>
                  )}
                  {isEditMode && <span className="badge-warning">Edit Mode</span>}
              </div>
          </div>
            {isEditMode && (
                <button
                    className="btn-secondary mt-1"
                    onClick={handleReschedule}
                    disabled={rescheduling}
                >
                    {rescheduling ? <><span className="btn-spinner" />Rescheduling...</> : "Reschedule"}
                </button>
            )}
      </div>

      <SessionControls
        selectedDate={selectedDate}
        notes={notes}
        sessionTime={sessionTime}
        classStartDate={classData?.start_date ?? ""}
        classEndDate={classData?.end_date ?? ""}
        onDateChange={setSelectedDate}
        onNotesChange={setNotes}
        onTimeChange={setSessionTime}
      />

      <StudentAttendanceGrid
        enrollments={enrollments}
        attendance={attendance}
        onToggle={handleToggle}
        onSubmit={handleSubmit}
        submitting={submitting}
        isEditMode={isEditMode}
      />

      {showReschedule && (
        <div className="modal-backdrop">
            <div className="modal-sm">
                <div className="modal-header">
                    <h3 className="modal-title">Reschedule Session</h3>
                    <button className="btn-icon modal-close" onClick={() => setShowReschedule(false)}>✕</button>
                </div>
                <div className="modal-body space-y-4">
                    <div className="alert alert-warning">
                        <span className="alert-desc">
                            Rescheduling is only allowed if no attendance has been recorded for this session.
                        </span>
                    </div>
                    <div className="form-field">
                        <label className="form-label">New Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={rescheduleDate}
                            min={classData?.start_date || undefined}
                            max={classData?.end_date || undefined}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                        />
                    </div>
                    <div className="form-field">
                        <label className="form-label">New Time</label>
                        <input
                            type="time"
                            className="form-input"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-muted" onClick={() => setShowReschedule(false)} disabled={rescheduling}>
                        Cancel
                    </button>
                    <button className="btn-primary" onClick={handleReschedule} disabled={rescheduling}>
                        {rescheduling ? <><span className="btn-spinner" />Rescheduling...</> : "Confirm Reschedule"}
                    </button>
                </div>
            </div>
        </div>
    )}
    </div>
  );
}