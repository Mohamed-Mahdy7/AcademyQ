import { useEffect, useState } from "react";
import { getStudentsRequest } from "../../services/studentService";

const EMPTY_FORM = {
  student_id: "",
  start_date: new Date().toISOString().split("T")[0], // ← today by default
  status: "active",
};

export default function EnrollmentForm({
  classId,
  classPrice,
  editingEnrollment,
  onSubmit,
  onCancel,
  errors,
  submitting,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [students, setStudents] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    getStudentsRequest()
      .then((res) => {
        const allUsers = res.data.results ?? res.data;
        setStudents(allUsers);
      })
      .catch((err) => console.error("Failed to load users", err))
      .finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => {
    if (editingEnrollment) {
      setForm({
        student_id: editingEnrollment.student_id || "",
        start_date: editingEnrollment.start_date || "",
        status: editingEnrollment.status || "active",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingEnrollment]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      student_id: form.student_id,
      class_id: classId,
      start_date: form.start_date,
      status: form.status,
      class_price: classPrice,
    }, editingEnrollment?.id);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-md">

        <div className="modal-header">
          <h2 className="modal-title">
            {editingEnrollment ? "Edit enrollment" : "Enroll student"}
          </h2>
          <button className="btn-icon modal-close" onClick={onCancel}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Class price info */}
            {classPrice && (
              <div className="alert alert-info">
                <p className="alert-desc">
                  Class price: <strong>{parseFloat(classPrice).toFixed(2)} EGP</strong>
                  — a pending payment will be created automatically.
                </p>
              </div>
            )}

            {/* Student dropdown — only on create */}
            {!editingEnrollment && (
              <div className="form-field">
                <label className="form-label">
                  Student <span className="form-required">*</span>
                </label>
                <select
                  name="student_id"
                  value={form.student_id}
                  onChange={handleChange}
                  className={errors?.student_id ? "form-select border-danger" : "form-select"}
                  required
                >
                  <option value="">
                    {loadingUsers ? "Loading students..." : "Select a student"}
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} — {s.email}
                    </option>
                  ))}
                </select>
                {errors?.student_id && (
                  <p className="form-error">
                    {Array.isArray(errors.student_id) ? errors.student_id[0] : errors.student_id}
                  </p>
                )}
              </div>
            )}

            {/* Start date */}
            <div className="form-field">
              <label className="form-label">
                Start date <span className="form-required">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className={errors?.start_date ? "form-input-error" : "form-input"}
                required
              />
              {errors?.start_date && (
                <p className="form-error">{errors.start_date}</p>
              )}
            </div>

            {/* Status — only on edit */}
            {editingEnrollment && (
              <div className="form-field">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="dropped">Dropped</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            {errors?.detail && (
              <div className="alert alert-danger">
                <p className="alert-desc">{errors.detail}</p>
              </div>
            )}

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-muted" onClick={onCancel}>Cancel</button>
            <button
              type="submit"
              className={`btn-primary ${submitting ? "btn-disabled" : ""}`}
              disabled={submitting}
            >
              {submitting ? (
                <><span className="btn-spinner" /> Saving...</>
              ) : editingEnrollment ? "Save changes" : "Enroll student"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}