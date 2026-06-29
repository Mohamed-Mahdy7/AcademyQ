import { useState, useEffect } from "react";
import { getPayments } from "../../services/paymentService";
import { useTranslation } from "react-i18next";

const EMPTY_FORM = {
  enrollment_id: "",
  amount: "",
  paid_on: new Date().toISOString().split("T")[0],
  notes: "",
  status: "completed",
};

export default function RecordPaymentForm({ onSubmit, onCancel, errors, submitting }) {
  const { t } = useTranslation("payment");
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Fetch all pending payments on mount
  useEffect(() => {
    setLoadingPending(true);
    getPayments({ status: "pending" })
      .then((res) => {
        const data = res.data.results ?? res.data;
        setPendingPayments(data);
      })
      .catch((err) => console.error("Failed to load pending payments", err))
      .finally(() => setLoadingPending(false));
  }, []);

  function handlePaymentSelect(e) {
    const paymentId = e.target.value;
    const payment = pendingPayments.find((p) => p.id === paymentId);
    setSelectedPayment(payment || null);
    if (payment) {
      setForm((prev) => ({
        ...prev,
        enrollment_id: payment.enrollment_id,
        amount: payment.amount,
      }));
    }
  }

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ ...form, payment_id: selectedPayment?.id });
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-md">

        <div className="modal-header">
          <h2 className="modal-title">{t("form.title")}</h2>
          <button className="btn-icon modal-close" onClick={onCancel}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Pending payments dropdown */}
            <div className="form-field">
              <label className="form-label">
                {t("form.pending_label")} <span className="form-required">*</span>
              </label>
              <select
                onChange={handlePaymentSelect}
                className="form-select"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  {loadingPending ? t("form.loading") : t("form.select_default")}
                </option>
                {pendingPayments.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.student_name}  — {p.class_name} 
                  </option>
                ))}
              </select>
              {pendingPayments.length === 0 && !loadingPending && (
                <p className="form-hint">{t("form.no_pending")}</p>
              )}
            </div>

            {/* Selected payment info */}
            {selectedPayment && (
              <div className="alert alert-info">
                <div>
                  <p className="alert-title">{t("form.payment_details")}</p>
                  <p className="alert-desc">
                    {t("form.amount")} <strong>{parseFloat(selectedPayment.amount).toFixed(2)} EGP</strong>
                    {selectedPayment.notes && <> · {t("table.headers.notes")}: {selectedPayment.notes}</>}
                  </p>
                </div>
              </div>
            )}

            {/* Payment date */}
            <div className="form-field">
              <label className="form-label">
                {t("form.date_label")} <span className="form-required">*</span>
              </label>
              <input
                  type="date"
                  name="paid_on"
                  value={form.paid_on}
                  onChange={handleChange}
                  min={selectedPayment?.enrollment_start_date || undefined}
                  max={new Date().toISOString().split("T")[0]}
                  className={errors?.paid_on ? "form-input-error" : "form-input"}
                  required
              />
              {selectedPayment?.due_date && (
                  <p className="form-hint">
                      Recording payment for due date: {selectedPayment.due_date}
                  </p>
              )}
              {errors?.paid_on && (
                <p className="form-error">{errors.paid_on}</p>
              )}
            </div>

            {/* Notes */}
            <div className="form-field">
              <label className="form-label">{t("form.notes_label")}</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder={t("form.notes_placeholder")}
                rows={3}
                className="form-textarea"
              />
            </div>

            {/* Action buttons */}
            {selectedPayment && (
              <div className="form-field">
                <label className="form-label">{t("form.action_label")}</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, status: "completed" }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.status === "completed"
                        ? "bg-success-bg border-success/30 text-success"
                        : "bg-muted border-border text-blue hover:bg-sky-pale"
                    }`}
                  >
                    {t("form.complete")}

                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, status: "cancelled" }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.status === "cancelled"
                        ? "bg-danger-bg border-danger/30 text-danger"
                        : "bg-muted border-border text-blue hover:bg-sky-pale"
                    }`}
                  >
                    {t("form.cancel")}

                  </button>
                </div>
                <p className="form-hint">
                  {t("form.selected")} <strong>{t(`filter.${form.status}`)}</strong>
                </p>
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
              {t("form.cancel_btn")}
            </button>
            <button
              type="submit"
              className={`${
                form.status === "cancelled" ? "btn-danger" : "btn-primary"
              } ${submitting || !selectedPayment ? "btn-disabled" : ""}`}
              disabled={submitting || !selectedPayment}
            >
              {submitting ? (
                <><span className="btn-spinner" /> {t("form.submit_saving")}</>
              ) : form.status === "cancelled" ? t("form.submit_cancel") : t("form.submit_complete")}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}