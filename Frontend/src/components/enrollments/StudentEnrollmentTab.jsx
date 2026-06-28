import { useEffect, useState } from "react";
import { useEnrollment } from "../../context/EnrollmentContext";
import StudentEnrollmentTable from "./StudentEnrollmentTable";
import { useTranslation } from "react-i18next";

export default function StudentEnrollmentTab({ studentId }) {
  const { t } = useTranslation("enrollment");
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
          <option value="">{t("student_tab.filter_all")}</option>
          <option value="active">{t("student_tab.filter_active")}</option>
          <option value="paused">{t("student_tab.filter_paused")}</option>
          <option value="dropped">{t("student_tab.filter_dropped")}</option>
          <option value="completed">{t("student_tab.filter_completed")}</option>
        </select>
        <div className="filter-bar-right">
          <p className="text-caption">
            {t(`student_tab.results${filtered.length !== 1 ? "_plural" : ""}`, { count: filtered.length })}
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