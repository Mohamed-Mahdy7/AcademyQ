import { useState , useEffect } from "react";
import { getEnrollments } from "../../services/enrollmentService";

const EMPTY_FORM = {
  enrollment_id: "",
  amount: "",
  paid_on: new Date().toISOString().split("T")[0],
  notes: "",
  status: "pending",
};

export default function AddPaymentForm({
  onSubmit,
  onCancel,
  errors,
  submitting,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    getEnrollments()
      .then((res) => {
        setEnrollments(res.data.results ?? res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    onSubmit({
      ...form,
      status: "pending",
    });
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal modal-md">

        <div className="modal-header">
          <h2 className="modal-title">Add New Payment</h2>

          <button className="btn-icon" onClick={onCancel}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Enrollment */}
            <div className="form-field">
              <label className="form-label">
                Student <span className="form-required">*</span>
              </label>

              <select
                name="enrollment_id"
                value={form.enrollment_id}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select student</option>

                {enrollments.map((e) => (
                  <option
                    key={e.id}
                    value={e.id}
                  >
                    {e.student_name} — {e.class_name}
                  </option>
                ))}
              </select>

              {errors?.enrollment_id && (
                <p className="form-error">
                  {errors.enrollment_id}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="form-field">
              <label className="form-label">
                Amount (EGP) <span className="form-required">*</span>
              </label>

              <input
                type="number"
                step="0.01"
                min="0"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className="form-input"
                required
              />

              {errors?.amount && (
                <p className="form-error">{errors.amount}</p>
              )}
            </div>

            {/* Payment Date */}
            <div className="form-field">
              <label className="form-label">
                Due Date <span className="form-required">*</span>
              </label>

              <input
                type="date"
                name="paid_on"
                value={form.paid_on}
                onChange={handleChange}
                className="form-input"
                required
              />

              {errors?.paid_on && (
                <p className="form-error">{errors.paid_on}</p>
              )}
            </div>

            {/* Notes */}
            <div className="form-field">
              <label className="form-label">Notes</label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className="form-textarea"
                placeholder="Optional notes..."
              />
            </div>

            <div className="alert alert-info">
              <p className="alert-desc">
                This payment will be created with status:
                <strong> pending</strong>
              </p>
            </div>

            {errors?.detail && (
              <div className="alert alert-danger">
                <p className="alert-desc">{errors.detail}</p>
              </div>
            )}

          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-muted"
              onClick={onCancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={`btn-primary ${
                submitting ? "btn-disabled" : ""
              }`}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Payment"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}