import { useState, useEffect } from "react";
import { useGrades } from "../../context/gradecontext";

export default function GradeForm({ enrollments = [], sessions = [], subjectName = "", onSuccess }) {
  const { addGrade } = useGrades();
  console.log("rendering")
  const [form, setForm] = useState({
    enrollment: "",
    session: "",
    subject_name: subjectName,
    score: "",
    max_score: "",
    assigned_at: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!form.enrollment || !form.score || !form.max_score || !form.assigned_at) {
      setError("Please fill all required fields.");
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
      await addGrade(payload);
      setSuccess(true);
      setForm({
        enrollment: "",
        session: "",
        subject_name: subjectName,
        score: "",
        max_score: "",
        assigned_at: "",
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      setError(error.response?.data?.detail || "Error adding grade.");
    }
  };

  return (
    <div className="card-body space-y-4 max-w-md">
      <h3 className="heading-3">Add Grade</h3>

      {error && <div className="alert alert-danger"><span>{error}</span></div>}
      {success && <div className="alert alert-success"><span>Grade added successfully.</span></div>}

      <div className="form-field">
        <label className="form-label">Student <span className="form-required">*</span></label>
        <select
          name="enrollment"
          value={form.enrollment}
          onChange={handleChange}
          className="form-select"
        >
          <option value="">Select Student</option>
          {enrollments.map((e) => (
            <option key={e.id} value={e.id}>
              {e.student_name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label className="form-label">Session</label>
        <select
          name="session"
          value={form.session}
          onChange={handleChange}
          className="form-select"
        >
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
        <input
          type="text"
          value={subjectName}
          disabled
          className="form-input-disabled"
        />
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

      <button className="btn-primary w-full" onClick={handleSubmit}>
        Save Grade
      </button>
    </div>
  );
}