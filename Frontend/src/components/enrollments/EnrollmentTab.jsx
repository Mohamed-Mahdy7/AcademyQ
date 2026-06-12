import { useEffect, useState } from "react";
import { useEnrollment } from "../../context/EnrollmentContext";
import { getClass } from "../../services/classService";
import EnrollmentTable from "./EnrollmentTable";
import EnrollmentForm from "./EnrollmentForm";
import { createPayment } from "../../services/paymentService";

export default function EnrollmentTab({ classId }) {
  const {
    enrollments, loading, error,
    listEnrollments, addEnrollment, editEnrollment, removeEnrollment,
  } = useEnrollment();

  const [showForm, setShowForm]         = useState(false);
  const [editingEnrollment, setEditing] = useState(null);
  const [formErrors, setFormErrors]     = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [dropConfirm, setDropConfirm]   = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [classPrice, setClassPrice]     = useState(null);

  useEffect(() => {
    if (classId) {
      listEnrollments({ class_id: classId });
        getClass(classId)
          .then((res) => {
            const data = res.data;
            const price = data.class_price ||
              (data.session_count && data.session_price
                ? data.session_count * data.session_price
                : null);
            setClassPrice(price);
          })
          .catch((err) => console.error("Failed to load class", err));
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

    if (id) {
      const result = await editEnrollment(id, { status: payload.status });
      setSubmitting(false);
      if (result.success) {
        closeForm();
        listEnrollments({ class_id: classId });
      } else {
        setFormErrors(result.errors || {});
      }
      return;
    }

    const result = await addEnrollment({
      student_id: payload.student_id,
      class_id: classId,
      start_date: payload.start_date,
      status: "active",
    });

    if (!result.success) {
      setSubmitting(false);
      setFormErrors(result.errors || {});
      return;
    }

    // Calculate due_date = start_date + 3 days
    const startDate = new Date(payload.start_date);
    startDate.setDate(startDate.getDate() + 3);
    const dueDate = startDate.toISOString().split("T")[0];

    // Create pending payment with due_date
    try {
      await createPayment({
        enrollment_id: result.enrollmentId,
        paid_on: null,
        due_date: dueDate,
        notes: "",
        status: "pending",
      });
    } catch (err) {
      console.error("Payment creation failed", err);
    }

    closeForm();
    listEnrollments({ class_id: classId });
  }                                        

  async function confirmDrop(enrollment) { 
    const result = await removeEnrollment(enrollment.id);
    if (result.success) {
      setDropConfirm(null);
      listEnrollments({ class_id: classId });
    }
  }

  const filtered = statusFilter
    ? enrollments.filter((e) => e.status === statusFilter)
    : enrollments;

  return (
    <div>
      <div className="filter-bar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="dropped">Dropped</option>
          <option value="completed">Completed</option>
        </select>
        <div className="filter-bar-right">
          <p className="text-caption">
            {filtered.length} student{filtered.length !== 1 ? "s" : ""}
          </p>
          <button className="btn-primary" onClick={openAdd}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Enroll student
          </button>
        </div>
      </div>

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

      {!loading && (
        <EnrollmentTable
          enrollments={filtered}
          classPrice={classPrice}
          onEdit={openEdit}
          onDrop={setDropConfirm}
        />
      )}

      {showForm && (
        <EnrollmentForm
          classId={classId}
          classPrice={classPrice}
          editingEnrollment={editingEnrollment}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          errors={formErrors}
          submitting={submitting}
        />
      )}

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