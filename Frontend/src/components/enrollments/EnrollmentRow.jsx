function getStatusClass(status) {
  switch (status) {
    case "active":    return "badge-success";
    case "paused":    return "badge-warning";
    case "dropped":   return "badge-danger";
    case "completed": return "badge-info";
    default:          return "badge-muted";
  }
}

export default function EnrollmentRow({ enrollment, classPrice, onEdit, onDrop }) {
  const dueDate = enrollment.payments?.[0]?.due_date || "—";
  return (
    <tr className="table-row">
      {/* Student */}
      <td className="table-cell">
        <p className="text-sm font-semibold text-navy">
          {enrollment.student_name || "—"}
        </p>
      </td>

      {/* Status */}
      <td className="table-cell">
        <span className={getStatusClass(enrollment.status)}>
          {enrollment.status}
        </span>
      </td>

      {/* Class price */}
      <td className="table-cell">
        <span className="text-sm font-semibold text-navy">
          {classPrice
            ? `${parseFloat(classPrice).toFixed(2)} EGP`
            : "—"}
        </span>
      </td>

      {/* Due date — empty until sessions done */}
      <td className="table-cell-muted">{dueDate}</td>

      {/* Start date */}
      <td className="table-cell-muted">{enrollment.start_date}</td>

      {/* Actions */}
      <td className="table-actions">
        <button
          className="btn-icon"
          onClick={() => onEdit(enrollment)}
          title="Edit enrollment"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          className="btn-icon text-danger hover:bg-danger-bg"
          onClick={() => onDrop(enrollment)}
          title="Drop enrollment"
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