import PaymentRow from "./PaymentRow";

export default function PaymentTable({ payments, onDelete }) {
  if (payments.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </div>
        <p className="empty-state-title">No payments yet</p>
        <p className="empty-state-desc">Record a payment to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead className="table-thead">
          <tr>
            <th>Student</th>
            <th>Class</th>
            <th>Amount</th>
            <th>Payment date</th>
            <th>Notes</th>
            <th className="text-right">Actions</th>
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