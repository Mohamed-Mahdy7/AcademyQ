export default function PaymentRow({ payment, onDelete }) {
  return (
    <tr className="table-row">
      <td className="table-cell">
        <p className="text-sm font-semibold text-navy">
          {payment.student_name || "—"}
        </p>
      </td>
      <td className="table-cell-muted">
        {payment.class_name || "—"}
      </td>
      <td className="table-cell">
        <span className="text-sm font-semibold text-success">
          {parseFloat(payment.amount).toFixed(2)} EGP
        </span>
      </td>
      <td className="table-cell-muted">{payment.paid_on}</td>
      <td className="table-cell-muted">
        {payment.notes || <span className="text-blue/40">—</span>}
      </td>
      <td className="table-actions">
        <button
          className="btn-icon text-danger hover:bg-danger-bg"
          onClick={() => onDelete(payment)}
          title="Delete payment"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </td>
    </tr>
  );
}