import { useEffect, useState } from "react";
import { usePayment } from "../../context/PaymentContext";
import StudentPaymentTable from "./StudentPaymentTable";

export default function StudentPaymentTab({ studentId }) {
  const { payments, loading, error, listPayments } = usePayment();
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (studentId) {
      listPayments({ student_id: studentId });
    }
  }, [studentId]);

  const filtered = statusFilter
    ? payments.filter((p) => p.status === statusFilter)
    : payments;

  return (
    <div>
      <div className="filter-bar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="filter-bar-right">
          <p className="text-caption">
            {filtered.length} payment{filtered.length !== 1 ? "s" : ""}
          </p>
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

      {!loading && <StudentPaymentTable payments={filtered} />}
    </div>
  );
}