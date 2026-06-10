 import { useEffect, useState } from "react";
import { useGrades } from "../../context/gradecontext";

export default function GradeForm({
  enrollments,
  sessions,
  subjectName,
}) {
  const { addGrade } = useGrades();

  const [form, setForm] = useState({
    enrollment: "",
    session: "",
    subject_name: subjectName || "",
    score: "",
    max_score: "",
    assigned_at: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      enrollment_id: Number(form.enrollment),
      session_id: Number(form.session),
      subject_name: form.subject_name,
      score: Number(form.score),
      max_score: Number(form.max_score),
      assigned_at: form.assigned_at,
    };

    try {
      await addGrade(payload);

      alert("Grade added successfully");

      // optional reset
      setForm({
        enrollment: "",
        session: "",
        subject_name: subjectName || "",
        score: "",
        max_score: "",
        assigned_at: "",
      });

    } catch (error) {
      console.error(error.response?.data || error);
      alert("Error adding grade");
    }
  };

  const safeEnrollments = enrollments || [];
  const safeSessions = sessions || [];

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "300px" }}>

      <select
        name="enrollment"
        value={form.enrollment}
        onChange={handleChange}
      >
        <option value="">Select Student</option>
        {safeEnrollments.map((item) => (
          <option key={item.id} value={item.id}>
            {item.student_name}
          </option>
        ))}
      </select>

      <select
        name="session"
        value={form.session}
        onChange={handleChange}
      >
        <option value="">Select Session</option>
        {safeSessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.title}
          </option>
        ))}
      </select>

      <label>Subject Name</label>
      
      <input
       style={{ border: "1px solid black" }} 
        name="subject_name"
        value={form.subject_name}
        onChange={handleChange}
      />

      <label>Score</label>
      <input
       style={{ border: "1px solid black" }} 
        type="number"
        name="score"
        value={form.score}
        onChange={handleChange}
      />

      <label>Maximum Score</label>
      <input
       style={{ border: "1px solid black" }} 
        type="number"
        name="max_score"
        value={form.max_score}
        onChange={handleChange}
      />

      <label>Assigned Date</label>
      <input
       style={{ border: "1px solid black" }} 
        type="date"
        name="assigned_at"
        value={form.assigned_at}
        onChange={handleChange}
      />

      <button style={{ padding: "10px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}  type="submit">
        Save Grade
      </button>
    </form>
  );
}