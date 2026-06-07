import TeacherCard from "./TeacherCard";

export default function TeachersList({ teachers, onEdit, onDelete }) {
  if (teachers.length === 0) {
    return <p>No teachers yet. Add one to get started.</p>;
  }

  return (
    <div>
      {teachers.map((teacher) => (
        <TeacherCard
          key={teacher.id}
          teacher={teacher}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}