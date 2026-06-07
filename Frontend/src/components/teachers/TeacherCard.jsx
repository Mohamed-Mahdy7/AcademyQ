export default function TeacherCard({ teacher, onEdit, onDelete }) {
  return (
    <div>
      <div>
        <p>{teacher.name || "—"}</p>
        <p>{teacher.email}</p>
        <p>{teacher.phone}</p>
      </div>
      <div>
        <p>{teacher.rate_per_session} EGP / session</p>
        <p>{teacher.session_duration}</p>
      </div>
      <div>
        <button onClick={() => onEdit(teacher)}>Edit</button>
        <button onClick={() => onDelete(teacher)}>Delete</button>
      </div>
    </div>
  );
}