import { useEffect, useState } from "react";
import { useEnrollment } from "../../context/EnrollmentContext";
import StudentEnrollmentTable from "./StudentEnrollmentTable";

export default function StudentEnrollmentTab({ studentId }) {
  const { enrollments, loading, error, listEnrollments } = useEnrollment();
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (studentId) {
      listEnrollments({ student_id: studentId });
    }
  }, [studentId]);

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
            {filtered.length} class{filtered.length !== 1 ? "es" : ""}
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

      {!loading && <StudentEnrollmentTable enrollments={filtered} />}
    </div>
  );
}