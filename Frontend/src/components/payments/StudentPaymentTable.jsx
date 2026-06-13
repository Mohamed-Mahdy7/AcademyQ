function getStatusClass(status) {
  switch (status) {
    case "completed": return "badge-success";
    case "pending":   return "badge-warning";
    case "cancelled": return "badge-danger";
    default:          return "badge-muted";
  }
}

export default function StudentPaymentTable({ payments }) {
  if (payments.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>
        <p className="empty-state-title">No payments found</p>
        <p className="empty-state-desc">This student has no payment records yet.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead className="table-thead">
          <tr>
            <th>Class</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Notes</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="table-row">

              <td className="table-cell">
                <p className="text-sm font-semibold text-navy">
                  {payment.class_name || "—"}
                </p>
              </td>

              <td className="table-cell">
                <span className="text-sm font-semibold text-navy">
                  {parseFloat(payment.amount).toFixed(2)} EGP
                </span>
              </td>

              <td className="table-cell-muted">
                {payment.paid_on || payment.due_date || "—"}
              </td>

              <td className="table-cell-muted">
                {payment.notes || "—"}
              </td>

              <td className="table-cell">
                <span className={getStatusClass(payment.status)}>
                  {payment.status}
                </span>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}