import PaymentRow from "./PaymentRow";
import { useTranslation } from "react-i18next";

export default function PaymentTable({ payments, onDelete }) {
  const { t } = useTranslation("payment");
  if (payments.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
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
            <th>{t("table.headers.student")}</th>
            <th>{t("table.headers.class")}</th>
            <th>{t("table.headers.amount")}</th>
            <th>{t("table.headers.status")}</th>
            <th>{t("table.headers.payment_date")}</th>
            <th>{t("table.headers.notes")}</th>
            <th className="text-end">{t("table.headers.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}