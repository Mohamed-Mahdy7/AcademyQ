import { useState, useEffect } from "react";
import { useGrades } from "../../context/gradecontext";
import { toast } from "../../lib/toastBus";
import api from "../../api";

export default function GradeForm({ enrollments = [], sessions = [], subjectName = "", classId, onSuccess }) {
  const { addGrade, findExistingGrade, editGrade } = useGrades();

  const [form, setForm] = useState({
    enrollment: "",
    session: "",
    subject_name: subjectName,
    score: "",
    max_score: "",
    assigned_at: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [attendedSessions, setAttendedSessions] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // when enrollment changes, fetch attended sessions for that student
  useEffect(() => {
    if (!form.enrollment || !classId) {
      setAttendedSessions([]);
      setForm(prev => ({ ...prev, session: "" }));
      return;
    }

    const enrollment = enrollments.find(e => e.id === form.enrollment);
    if (!enrollment) return;

    setLoadingAttendance(true);
    api.get(`/api/students/${enrollment.student_id}/attendance/history/?class_id=${classId}`)
      .then(res => {
        const history = res.data.results ?? res.data;
        // only sessions where present=true
        const presentSessionNums = history
          .filter(r => r.present)
          .map(r => r.session_num);

        const filtered = sessions.filter(s =>
          presentSessionNums.includes(s.session_num)
        );
        setAttendedSessions(filtered);
        setForm(prev => ({ ...prev, session: "" }));
      })
      .catch(() => setAttendedSessions([]))
      .finally(() => setLoadingAttendance(false));
  }, [form.enrollment, classId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({});
    setConfirmOverwrite(false);
  };

  const resetForm = () => {
    setForm({
      enrollment: "",
      session: "",
      subject_name: subjectName,
      score: "",
      max_score: "",
      assigned_at: "",
    });
    setAttendedSessions([]);
    setConfirmOverwrite(false);
    setPendingPayload(null);
  };

  const handleConfirmOverwrite = async () => {
    try {
      const existing = await findExistingGrade(
        pendingPayload.enrollment,
        pendingPayload.session,
        pendingPayload.subject_name
      );
      if (!existing) {
        toast.danger("Error", "Could not find the existing grade to update.");
        setConfirmOverwrite(false);
        return;
      }
      await editGrade(existing.id, pendingPayload);
      toast.success("Grade updated", "Existing grade has been updated.");
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      const data = error.response?.data;
      toast.danger("Failed to update grade", data?.detail || error.message || "Error updating grade.");
      setConfirmOverwrite(false);
    }
  };

  const handleSubmit = async () => {
    setFieldErrors({});

    if (!form.enrollment || !form.score || !form.max_score || !form.assigned_at || !form.session) {
      toast.danger("Missing fields", "Please fill all required fields including session.");
      return;
    }

    if (Number(form.max_score) <= 0) {
      setFieldErrors({ max_score: ["Max score must be greater than 0."] });
      return;
    }

    if (Number(form.score) > Number(form.max_score)) {
      setFieldErrors({ score: ["Score cannot be greater than max score."] });
      return;
    }

    // date validation — assigned_at cannot be before session date
    const selectedSession = sessions.find(s => s.id === form.session);
    if (selectedSession && form.assigned_at < selectedSession.session_date) {
      setFieldErrors({ assigned_at: ["Assigned date cannot be before the session date."] });
      return;
    }

    const payload = {
      enrollment: form.enrollment,
      session: form.session,
      subject_name: form.subject_name,
      score: form.score,
      max_score: form.max_score,
      assigned_at: form.assigned_at,
    };

    try {
      const result = await addGrade(payload);
      if (result.isDuplicate) {
        setPendingPayload(payload);
        setConfirmOverwrite(true);
        return;
      }
      toast.success("Grade saved", "Grade has been recorded successfully.");
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      const data = error.response?.data;
      if (data?.fields) {
        setFieldErrors(data.fields);
      } else {
        toast.danger("Failed to save grade", data?.detail || error.message || "Error adding grade.");
      }
    }
  };

  return (
    <div className="card-body space-y-4 max-w-md">
      <h3 className="heading-3">Add Grade</h3>

      {confirmOverwrite && (
        <div className="alert alert-warning">
          <span>
            A grade already exists for this student/session/subject.
            Do you want to update it?
          </span>
          <div className="flex gap-2 mt-2">
            <button className="btn-primary" onClick={handleConfirmOverwrite}>
              Yes, update it
            </button>
            <button className="btn-muted" onClick={() => setConfirmOverwrite(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="form-field">
        <label className="form-label">Student <span className="form-required">*</span></label>
        <select name="enrollment" value={form.enrollment} onChange={handleChange} className="form-select">
          <option value="">Select Student</option>
          {enrollments.map((e) => (
            <option key={e.id} value={e.id}>{e.student_name}</option>
          ))}
        </select>
        {fieldErrors.enrollment && <p className="form-error">{fieldErrors.enrollment[0]}</p>}
      </div>

      <div className="form-field">
        <label className="form-label">Session <span className="form-required">*</span></label>
        <select
          name="session"
          value={form.session}
          onChange={handleChange}
          className="form-select"
          disabled={!form.enrollment || loadingAttendance}
        >
          <option value="">
            {!form.enrollment
              ? "Select a student first"
              : loadingAttendance
              ? "Loading sessions..."
              : attendedSessions.length === 0
              ? "No attended sessions found"
              : "Select Session"}
          </option>
          {attendedSessions.map((s) => (
            <option key={s.id} value={s.id}>
              Session {s.session_num} — {s.session_date}
            </option>
          ))}
        </select>
        {fieldErrors.session && <p className="form-error">{fieldErrors.session[0]}</p>}
      </div>

      <div className="form-field">
        <label className="form-label">Subject</label>
        <input type="text" value={subjectName} disabled className="form-input-disabled" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-field">
          <label className="form-label">Score <span className="form-required">*</span></label>
          <input type="number" name="score" value={form.score} onChange={handleChange} className="form-input" />
          {fieldErrors.score && <p className="form-error">{fieldErrors.score[0]}</p>}
        </div>
        <div className="form-field">
          <label className="form-label">Max Score <span className="form-required">*</span></label>
          <input type="number" name="max_score" value={form.max_score} onChange={handleChange} className="form-input" />
          {fieldErrors.max_score && <p className="form-error">{fieldErrors.max_score[0]}</p>}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Assigned Date <span className="form-required">*</span></label>
        <input
          type="date"
          name="assigned_at"
          value={form.assigned_at}
          onChange={handleChange}
          className="form-input"
          min={sessions.find(s => s.id === form.session)?.session_date || undefined}
        />
        {fieldErrors.assigned_at && <p className="form-error">{fieldErrors.assigned_at[0]}</p>}
      </div>

      <button className="btn-primary w-full" onClick={handleSubmit} disabled={confirmOverwrite}>
        Save Grade
      </button>
    </div>
  );
}