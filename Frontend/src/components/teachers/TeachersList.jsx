import { useState } from "react";
import TeacherCard from "./TeacherCard";
import { useTranslation } from "react-i18next";

export default function TeachersList({ teachers, onEdit, onDelete }) {
  const { t } = useTranslation("teacher");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  if (teachers.length === 0) {
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
        <p className="empty-state-title">{t("list.empty_title")}</p>
        <p className="empty-state-desc">{t("list.empty_desc")}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(teachers.length / pageSize);
  const currentTeachers = teachers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead className="table-thead">
            <tr>
              <th>{t("list.table_name")}</th>
              <th>{t("list.table_email")}</th>
              <th>{t("list.table_phone")}</th>
              <th className="text-end">{t("list.table_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {currentTeachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <p className="pagination-info">
            {t("pagination.page_info", { page, total: totalPages })}
          </p>
          <div className="pagination-btns">
            <button
              className={page === 1 ? "pagination-btn-disabled" : "pagination-btn"}
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={p === page ? "pagination-btn-active" : "pagination-btn"}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className={page === totalPages ? "pagination-btn-disabled" : "pagination-btn"}
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}