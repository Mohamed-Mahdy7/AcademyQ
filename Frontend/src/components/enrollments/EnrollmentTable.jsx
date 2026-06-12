import EnrollmentRow from "./EnrollmentRow";

export default function EnrollmentTable({ enrollments, classPrice, onEdit, onDrop }) {
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
        <p className="empty-state-title">No students enrolled</p>
        <p className="empty-state-desc">Enroll a student in this class to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead className="table-thead">
          <tr>
            <th>Student</th>
            <th>Status</th>
            <th>Class price</th>
            <th>Due date</th>
            <th>Start date</th>
            <th className="text-right">Actions</th>
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