import { useState } from "react";
import TeacherCard from "./TeacherCard";

export default function TeachersList({ teachers, onEdit, onDelete }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  if (teachers.length === 0) {
    return (
      <div className="empty-state">
        <p>No teachers found.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(teachers.length / pageSize);

  const currentTeachers = teachers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead className="table-thead">
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Rate / session</th>
              <th>Duration</th>
              <th className="text-right">Actions</th>
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
        <div
          className="pagination"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}