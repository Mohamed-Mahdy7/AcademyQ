import { useTranslation } from "react-i18next";

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function TeacherCard({ teacher, onEdit, onDelete }) {
  const { t } = useTranslation("teacher");

  return (
    <tr className="table-row">
      <td className="table-cell">
        <div className="flex items-center gap-3">
          <div className="avatar avatar-md flex-shrink-0">
            {getInitials(teacher.name || teacher.email)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy truncate">
              {teacher.name || "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="table-cell-muted">{teacher.email || "—"}</td>
      <td className="table-cell-muted">{teacher.phone || "—"}</td>
      <td className="table-actions">
        <button
          className="btn-icon"
          onClick={() => onEdit(teacher)}
          title={t("card.edit_title")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          className="btn-icon text-danger hover:bg-danger-bg"
          onClick={() => onDelete(teacher)}
          title={t("card.delete_title")}
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