import { useState } from "react";

const EMPTY_FORM = {
  enrollment_id: "",
  amount: "",
  paid_on: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function RecordPaymentForm({ onSubmit, onCancel, errors, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-md">

        <div className="modal-header">
          <h2 className="modal-title">Record payment</h2>
          <button className="btn-icon modal-close" onClick={onCancel}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Enrollment ID */}
            <div className="form-field">
              <label className="form-label">
                Enrollment ID <span className="form-required">*</span>
              </label>
              <input
                type="text"
                name="enrollment_id"
                value={form.enrollment_id}
                onChange={handleChange}
                placeholder="Paste enrollment UUID"
                className={errors?.enrollment_id ? "form-input-error" : "form-input"}
                required
              />
              {errors?.enrollment_id && (
                <p className="form-error">
                  {Array.isArray(errors.enrollment_id) ? errors.enrollment_id[0] : errors.enrollment_id}
                </p>
              )}
              <p className="form-hint">Will be replaced with a dropdown once students API is ready</p>
            </div>

            {/* Amount */}
            <div className="form-field">
              <label className="form-label">
                Amount (EGP) <span className="form-required">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="e.g. 500"
                min="0"
                step="0.01"
                className={errors?.amount ? "form-input-error" : "form-input"}
                required
              />
              {errors?.amount && (
                <p className="form-error">
                  {Array.isArray(errors.amount) ? errors.amount[0] : errors.amount}
                </p>
              )}
            </div>

            {/* Payment date */}
            <div className="form-field">
              <label className="form-label">
                Payment date <span className="form-required">*</span>
              </label>
              <input
                type="date"
                name="paid_on"
                value={form.paid_on}
                onChange={handleChange}
                className={errors?.paid_on ? "form-input-error" : "form-input"}
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
                placeholder="e.g. Cash payment, Bank transfer..."
                rows={3}
                className="form-textarea"
              />
            </div>

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
              ) : "Record payment"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}