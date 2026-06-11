import { useEffect, useState } from "react";
import { useEnrollment } from "../../context/EnrollmentContext";
import EnrollmentTable from "./EnrollmentTable";
import EnrollmentForm from "./EnrollmentForm";

export default function EnrollmentTab({ classId }) {
  const {
    enrollments,
    loading,
    error,
    listEnrollments,
    addEnrollment,
    editEnrollment,
    removeEnrollment,
  } = useEnrollment();

  const [showForm, setShowForm]           = useState(false);
  const [editingEnrollment, setEditing]   = useState(null);
  const [formErrors, setFormErrors]       = useState({});
  const [submitting, setSubmitting]       = useState(false);
  const [dropConfirm, setDropConfirm]     = useState(null);
  const [statusFilter, setStatusFilter]   = useState("");

  // Load enrollments for this class on mount and when classId changes
  useEffect(() => {
    if (classId) {
      listEnrollments({ class_id: classId });
    }
  }, [classId]);

  function openAdd() {
    setEditing(null);
    setFormErrors({});
    setShowForm(true);
  }

  function openEdit(enrollment) {
    setEditing(enrollment);
    setFormErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setFormErrors({});
  }

  async function handleSubmit(payload, id) {
    setSubmitting(true);
    const result = id
      ? await editEnrollment(id, {
          fee_amount: payload.fee_amount,
          end_date: payload.end_date,
          status: payload.status,
        })
      : await addEnrollment(payload);
    setSubmitting(false);

    if (result.success) {
      closeForm();
      listEnrollments({ class_id: classId });
    } else {
      setFormErrors(result.errors || {});
    }
  }

  async function confirmDrop(enrollment) {
    const result = await removeEnrollment(enrollment.id);
    if (result.success) {
      setDropConfirm(null);
      listEnrollments({ class_id: classId });
    }
  }

  // Stats
  const activeCount  = enrollments.filter((e) => e.status === "active").length;
  const totalBalance = enrollments.reduce(
    (sum, e) => sum + parseFloat(e.balance_due || 0), 0
  );

  // Filter
  const filtered = statusFilter
    ? enrollments.filter((e) => e.status === statusFilter)
    : enrollments;

  return (
    <div>

      {/* Stats row */}
      {/* <div className="stat-grid mb-6">
        <div className="kpi-card">
          <p className="kpi-label">Total enrolled</p>
          <p className="kpi-value">{enrollments.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Active</p>
          <p className="kpi-value">{activeCount}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total balance due</p>
          <p className="kpi-value text-danger">{totalBalance.toFixed(2)} EGP</p>
        </div>
      </div> */}

      {/* Toolbar */}
      <div className="filter-bar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">Student status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="dropped">Dropped</option>
          <option value="completed">Completed</option>
        </select>
        <div className="filter-bar-right">
          <p className="text-caption">{filtered.length} student{filtered.length !== 1 ? "s" : ""}</p>
          <button className="btn-primary" onClick={openAdd}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Enroll student
          </button>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4">
          <p className="alert-desc">{error}</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <EnrollmentTable
          enrollments={filtered}
          onEdit={openEdit}
          onDrop={setDropConfirm}
        />
      )}

      {/* Form modal */}
      {showForm && (
        <EnrollmentForm
          classId={classId}
          editingEnrollment={editingEnrollment}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          errors={formErrors}
          submitting={submitting}
        />
      )}

      {/* Drop confirmation */}
      {dropConfirm && (
        <div className="modal-backdrop">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">Drop enrollment?</h2>
              <button className="btn-icon" onClick={() => setDropConfirm(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <p className="alert-desc">
                  <strong>{dropConfirm.student_name}</strong>'s enrollment will be set to <strong>dropped</strong>. No data will be deleted.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-muted" onClick={() => setDropConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => confirmDrop(dropConfirm)}>Drop</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}