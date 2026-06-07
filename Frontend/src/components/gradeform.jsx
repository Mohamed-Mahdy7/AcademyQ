import { useState } from "react";
import { useGrades } from "../context/gradecontext";

export default function GradeForm({
  enrollments,
  sessions,
  subjectName,
  onSubmit
}) {
//   const { addGrade } = useGrades();

  const [form, setForm] = useState({
    enrollment: "",
    session: "",
    subject_name: subjectName,
    score: "",
    max_score: "",
    assigned_at: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // await addGrade(form);

    // alert(
    //   "Grade created successfully"
    // );

        if (onSubmit) {
      onSubmit(form);   // 👈 هنا الربط
    }

  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "300px"  }}>
      <div style={{ display: "flex", flexDirection: "row", gap: "1000px", background: "#f0f0f0", padding: "10px", borderRadius: "5px" }}> 
      <select
        name="enrollment"
        onChange={handleChange}
      >
        <option value="">
          Select Student
        </option>

        {enrollments.map((item) => (
          <option
            key={item.id}
            value={item.id}
          >
            {item.student_name}
          </option>
        ))}
      </select>

      <select
        name="session"
        onChange={handleChange}
      >
        <option value="">
          Select Session
        </option>

        {sessions.map((session) => (
          <option
            key={session.id}
            value={session.id}
          >
            {session.title}
          </option>
        ))}
      </select>
        </div>
      <input style={{ border: "1px solid black" }}
        name="subject_name"
        value={form.subject_name}
        onChange={handleChange}
      />

      <input style={{ border: "1px solid black" }}
        type="number"
        name="score"
        onChange={handleChange}
      />

      <input style={{ border: "1px solid black" }}
        type="number"
        name="max_score"
        onChange={handleChange}
      />

       <input   style={{ border: "1px solid black" }}
        type="date"
        name="assigned_at"
        onChange={handleChange}
      />

      <button type="submit" style={{ padding: "10px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
        Save Grade
      </button>
    </form>
  );
}