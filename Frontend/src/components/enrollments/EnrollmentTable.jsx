import EnrollmentRow from "./EnrollmentRow";
import { useTranslation } from "react-i18next";

export default function EnrollmentTable({ enrollments, classPrice, onEdit, onDrop }) {
  const { t } = useTranslation("enrollment");
  if (enrollments.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
          <p className="empty-state-title">{t("table.empty_title")}</p>
          <p className="empty-state-desc">{t("table.empty_desc")}</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead className="table-thead">
          <tr>
            <th>{t("table.header_student")}</th>
            <th>{t("table.header_status")}</th>
            <th>{t("table.header_class_price")}</th>
            <th>{t("table.header_due_date")}</th>
            <th>{t("table.header_start_date")}</th>
            <th className="text-end">{t("table.header_actions")}</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enrollment) => (
            <EnrollmentRow
              key={enrollment.id}
              enrollment={enrollment}
              classPrice={classPrice}
              onEdit={onEdit}
              onDrop={onDrop}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}