import { useEffect, useState } from "react";
import { getUsersRequest } from "../../services/usersService"

const EMPTY_FORM = {
  student_id: "",
  fee_amount: "",
  payment_cycle: "",
  start_date: "",
  end_date: "",
  status: "active",
};

export default function EnrollmentForm({
  classId,
  editingEnrollment,
  onSubmit,
  onCancel,
  errors,
  submitting,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (editingEnrollment) {
      setForm({
        student_id: editingEnrollment.student_id || "",
        fee_amount: editingEnrollment.fee_amount || "",
        payment_cycle: editingEnrollment.payment_cycle || "",
        start_date: editingEnrollment.start_date || "",
        end_date: editingEnrollment.end_date || "",
        status: editingEnrollment.status || "active",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingEnrollment]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await getUsersRequest();

        // adjust depending on your API shape
        setUsers(res.data || []);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const students = users.filter(
    (u) => u.role === "S" || u.user_type === "student"
  );

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      class_id: classId,
    };
    onSubmit(payload, editingEnrollment?.id);
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

            {/* Student ID — only on create */}
            {!editingEnrollment && (
              <div className="form-field">
                <label className="form-label">
                  Student ID <span className="form-required">*</span>
                </label>
                <select
                  name="student_id"
                  value={form.student_id}
                  onChange={handleChange}
                  className={errors?.student_id ? "form-input-error" : "form-input"}
                  required
                >
                  <option value="">
                    {loadingUsers ? "Loading students..." : "Select a student"}
                  </option>

                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name || student.username || student.email}
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

            {/* Fee amount */}
            <div className="form-field">
              <label className="form-label">
                Fee amount (EGP) <span className="form-required">*</span>
              </label>
              <input
                type="number"
                name="fee_amount"
                value={form.fee_amount}
                onChange={handleChange}
                placeholder="e.g. 500"
                min="0"
                step="0.01"
                className={errors?.fee_amount ? "form-input-error" : "form-input"}
                required
              />
              {errors?.fee_amount && (
                <p className="form-error">
                  {Array.isArray(errors.fee_amount) ? errors.fee_amount[0] : errors.fee_amount}
                </p>
              )}
            </div>

            {/* Start / End dates */}
            <div className="flex gap-3">
              <div className="form-field flex-1">
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
              <div className="form-field flex-1">
                <label className="form-label">End date</label>
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
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
            <button type="button" className="btn-muted" onClick={onCancel}>
              Cancel
            </button>
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