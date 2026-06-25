import { useState } from "react";
import { useGrades } from "../../context/gradecontext";
import { toast } from "../../lib/toastBus";

export default function GradeForm({ enrollments = [], sessions = [], subjectName = "", onSuccess }) {
  const { addGrade, findExistingGrade, editGrade } = useGrades();

  const [form, setForm] = useState({
    enrollment: "",
    session: "",
    subject_name: subjectName,
    score: "",
    max_score: "",
    assigned_at: "",
  });

  // const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  // const [success, setSuccess] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
    setFieldErrors({});
    setSuccess(false);
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
        setError("Could not find the existing grade to update.");
        setConfirmOverwrite(false);
        return;
      }
      await editGrade(existing.id, pendingPayload);
      toast.success("Grade updated", "Existing grade has been updated.");
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.danger("Failed to update grade", data?.detail || error.message || "Error updating grade.");
      setConfirmOverwrite(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setFieldErrors({});

    if (!form.enrollment || !form.score || !form.max_score || !form.assigned_at) {
      setError("Please fill all required fields.");
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

    const payload = {
      enrollment: form.enrollment,
      session: form.session || null,
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
        setError("Please fix the highlighted fields.");
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
            A grade already exists for this student in the selected session of this class.
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
        {fieldErrors.enrollment && (
          <p className="form-error">{fieldErrors.enrollment[0]}</p>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">Session</label>
        <select name="session" value={form.session} onChange={handleChange} className="form-select">
          <option value="">Select Session (optional)</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              Session {s.session_num} — {s.session_date}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="form-label">Subject</label>
        <input type="text" value={subjectName} disabled className="form-input-disabled" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-field">
          <label className="form-label">Score <span className="form-required">*</span></label>
          <input
            type="number"
            name="score"
            value={form.score}
            onChange={handleChange}
            className="form-input"
          />
          {fieldErrors.score && (
            <p className="form-error">{fieldErrors.score[0]}</p>
          )}
        </div>
        <div className="form-field">
          <label className="form-label">Max Score <span className="form-required">*</span></label>
          <input
            type="number"
            name="max_score"
            value={form.max_score}
            onChange={handleChange}
            className="form-input"
          />
          {fieldErrors.max_score && (
            <p className="form-error">{fieldErrors.max_score[0]}</p>
          )}
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
        />
      </div>

      <button className="btn-primary w-full" onClick={handleSubmit} disabled={confirmOverwrite}>
        Save Grade
      </button>
    </div>
  );
}