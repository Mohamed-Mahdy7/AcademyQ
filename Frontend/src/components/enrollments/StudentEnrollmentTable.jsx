import { useTranslation } from "react-i18next";

function getStatusClass(status) {
  switch (status) {
    case "active":    return "badge-success";
    case "paused":    return "badge-warning";
    case "dropped":   return "badge-danger";
    case "completed": return "badge-info";
    default:          return "badge-muted";
  }
}

export default function StudentEnrollmentTable({ enrollments }) {
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
        <p className="empty-state-title">{t("student_table.empty_title")}</p>
        <p className="empty-state-desc">{t("student_table.empty_desc")}</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead className="table-thead">
          <tr>
            <th>{t("student_table.header_class_name")}</th>
            <th>{t("student_table.header_class_price")}</th>
            <th>{t("student_table.header_total_paid")}</th>
            <th>{t("student_table.header_balance_due")}</th>
            <th>{t("student_table.header_status")}</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enrollment) => {
            const payments = enrollment.payments ?? [];

            const classPrice = payments.length > 0
              ? parseFloat(payments[0].amount)
              : null;

            const totalPaid = payments
              .filter((p) => p.status === "completed")
              .reduce((sum, p) => sum + parseFloat(p.amount), 0);

            const balanceDue = payments
              .filter((p) => p.status === "pending")
              .reduce((sum, p) => sum + parseFloat(p.amount), 0);

            return (
              <tr key={enrollment.id} className="table-row">

                <td className="table-cell">
                  <p className="text-sm font-semibold text-navy">
                    {enrollment.class_name || "—"}
                  </p>
                </td>

                <td className="table-cell">
                  <span className="text-sm font-semibold text-navy">
                    {classPrice !== null
                      ? `${classPrice.toFixed(2)} EGP`
                      : "—"}
                  </span>
                </td>
                <td className="table-cell">
                  {totalPaid > 0
                    ? <span className="text-sm font-semibold text-success">
                        {totalPaid.toLocaleString()} EGP
                      </span>
                    : <span className="text-sm font-semibold text-navy">0.00 EGP</span>}
                </td>

                <td className="table-cell">
                  {balanceDue > 0
                    ? <span className="text-sm font-semibold text-danger">
                        {balanceDue.toLocaleString()} EGP
                      </span>
                    : <span className="text-sm font-semibold text-navy">0.00 EGP</span>}
                </td>
                <td className="table-cell">
                  <span className={getStatusClass(enrollment.status)}>
                    {t(`form.status_${enrollment.status}`)}
                  </span>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}