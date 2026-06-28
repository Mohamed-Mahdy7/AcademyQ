import { useTranslation } from "react-i18next";

export default function StudentAttendanceGrid({ enrollments, attendance, onToggle, onSubmit, submitting, isEditMode }) {
  const { t } = useTranslation(["attendance", "common"]);

  return (
    <div className="card">
      <div className="card-header flex-wrap gap-2">
        <h3 className="card-header-title">{t("students")}</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="badge-count">
            {t("present_count", {
              present: Object.values(attendance).filter(Boolean).length,
              total: enrollments.length,
            })}
          </span>
          <button className="btn-primary" onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <><span className="btn-spinner" />{t("saving")}</>
            ) : isEditMode ? t("update_attendance") : t("save_attendance")}
          </button>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">{t("no_students_enrolled")}</div>
          <div className="empty-state-desc">{t("no_students_enrolled_desc")}</div>
        </div>
      ) : (
        <ul>
          {enrollments.map((e) => (
            <li key={e.id} className="attendance-row flex-wrap gap-2">
              <span className="attendance-name">{e.student_name}</span>
              <div className="flex items-center gap-2 ms-auto flex-shrink-0">
                <button
                  className={attendance[e.id] ? "attendance-toggle-present" : "attendance-toggle-inactive"}
                  onClick={() => onToggle(e.id, true)}
                >
                  {t("present")}
                </button>
                <button
                  className={!attendance[e.id] ? "attendance-toggle-absent" : "attendance-toggle-inactive"}
                  onClick={() => onToggle(e.id, false)}
                >
                  {t("absent")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}