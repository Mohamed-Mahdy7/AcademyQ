import { useEffect, useState } from "react";
import { usePayment } from "../context/PaymentContext";
import PaymentSummaryCards from "../components/payments/PaymentSummaryCards";
import PaymentTable from "../components/payments/PaymentTable";
import RecordPaymentForm from "../components/payments/RecordPaymentForm";
import AddPaymentForm from "../components/payments/AddPaymentForm";
import { toast } from "../lib/toastBus";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function PaymentsPage() {
  const {
    payments, summary, loading, summaryLoading, error,
    listPayments, fetchSummary, addPayment, removePayment, editPayment,
  } = usePayment();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showForm, setShowForm]           = useState(false);
  const [formErrors, setFormErrors]       = useState({});
  const [submitting, setSubmitting]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchSummary(selectedMonth);
    listPayments({ month: selectedMonth });
  }, [selectedMonth]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    const result = await editPayment(payload.payment_id, {
      status: payload.status,
      paid_on: payload.paid_on,
      notes: payload.notes,
    });
    setSubmitting(false);
    if (result.success) {
      setShowForm(false);
      setFormErrors({});
      listPayments({ month: selectedMonth });
      fetchSummary(selectedMonth);
    } else {
      setFormErrors(result.errors || {});
      if (result.errors?.detail) {
        toast.danger("Could not update payment", result.errors.detail);
      }
    }
  }

  async function confirmDelete(payment) {
    const result = await removePayment(payment.id);
    if (result.success) {
      setDeleteConfirm(null);
      listPayments({ month: selectedMonth });
      fetchSummary(selectedMonth);
    }
  }

  async function handleCreatePayment(payload) {
    setSubmitting(true);
    const result = await addPayment(payload);
    setSubmitting(false);
    if (result.success) {
      setShowAddForm(false);
      listPayments({ month: selectedMonth });
      fetchSummary(selectedMonth);
    } else {
      setFormErrors(result.errors || {});
      if (result.errors?.detail) {
        toast.danger("Could not create payment", result.errors.detail);
      }
    }
  }

  // Build month options — last 12 months
  const monthOptions = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    monthOptions.push({ val, label });
  }

  return (
    <div className="page-body">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="heading-1">Payments & Finance</h1>
          <p className="subheading">
            Track revenue, manage payments, and monitor outstanding fees
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {/* <button className="btn-primary" onClick={() => setShowAddForm(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add new payment
          </button> */}

          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Record payment
          </button>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-navy">View month:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="filter-select"
        >
          {monthOptions.map((m) => (
            <option key={m.val} value={m.val}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Summary KPI cards */}
      <PaymentSummaryCards summary={summary} loading={summaryLoading} />

      {/* Overdue Payments Table */}
      {summary?.overdue_count > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="bg-warning-bg border-b border-warning/30 px-5 py-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-warning flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-warning">
                {summary.overdue_count} overdue payment{summary.overdue_count !== 1 ? "s" : ""} require attention
              </p>
              <p className="text-xs text-warning/80 mt-0.5">
                Total outstanding: {parseFloat(summary.overdue_total).toLocaleString()} EGP
              </p>
            </div>
          </div>

          <div className="table-wrap rounded-none border-0">
            <table className="table">
              <thead className="table-thead">
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Amount Due</th>
                  <th>Days Overdue</th>
                  <th>Parent Email</th>
                </tr>
              </thead>
              <tbody>
                {payments
                  .filter((p) => {
                    if (p.status !== "pending") return false;
                    if (!p.due_date) return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const due = new Date(p.due_date);
                    due.setHours(0, 0, 0, 0);
                    return due < today;  
                  })
                  .map((payment) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const due = new Date(payment.due_date);
                    due.setHours(0, 0, 0, 0);
                    const daysOverdue = Math.floor(
                      (today - due) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <tr key={payment.id} className="table-row">
                        <td className="table-cell font-medium">{payment.student_name || "—"}</td>
                        <td className="table-cell-muted">{payment.class_name || "—"}</td>
                        <td className="table-cell">
                          <span className="text-warning font-semibold">
                            {payment.amount
                              ? `${parseFloat(payment.amount).toFixed(2)} EGP`
                              : "—"}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="badge-danger">{daysOverdue} days</span>
                        </td>
                        <td className="table-cell-muted">
                          {payment.parent_email || "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent payments */}
      <div className="mb-2">
        <h2 className="heading-3 mb-1">Recent payments</h2>
        <p className="text-caption">Latest payment records for {selectedMonth}</p>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          <p className="alert-desc">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <PaymentTable
           payments={payments.filter(
            (payment) => payment.status?.toLowerCase() !== "deleted"
          )}
          onDelete={setDeleteConfirm}
        />
      )}

      {/* Add payment modal */}
      {showAddForm && (
        <AddPaymentForm
          onSubmit={handleCreatePayment}
          onCancel={() => setShowAddForm(false)}
          errors={formErrors}
          submitting={submitting}
        />
      )}

      {/* Record payment modal */}
      {showForm && (
        <RecordPaymentForm
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setFormErrors({}); }}
          errors={formErrors}
          submitting={submitting}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="modal-backdrop">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Delete payment?</h2>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">
                <p className="alert-desc">
                  This will permanently delete the payment of{" "}
                  <strong>{parseFloat(deleteConfirm.amount).toFixed(2)} EGP</strong>.
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-muted" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => confirmDelete(deleteConfirm)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}