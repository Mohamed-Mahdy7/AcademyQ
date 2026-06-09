import { useState } from "react";
import { useGrades } from "../../context/gradecontext";

export default function GradeForm({
  enrollments,
  sessions,
  subjectName,
  onSubmit
}) {
//   const { addGrade } = useGrades();
  const safeEnrollments = enrollments || [];
  const safeSessions = sessions || [];

  const [form, setForm] = useState({
    enrollment : "",
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
      onSubmit(form);  
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

        {safeEnrollments.map((item) => (
          <option
            key={item.id}
            value={item.id || ""}
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

        {safeSessions.map((session) => (
          <option
            key={session.id}
            value={session.id || ""}
          >
            {session.title}
          </option>
        ))}
      </select>
        </div>
        <label style={{ fontWeight: "bold" }}>Subject Name</label>
      <input style={{ border: "1px solid black" }}
        name="subject_name"

        value={form.subject_name || ""}
        onChange={handleChange}
      />
        
        <label style={{ fontWeight: "bold" }}>Score</label>
      <input style={{ border: "1px solid black" }} 
        type="number"
        value={form.score || ""}
        name="score"
        onChange={handleChange}
      />

      <label style={{ fontWeight: "bold" }}>Maximum Score</label> 
      <input style={{ border: "1px solid black" }}
        type="number"
        value={form.max_score || ""}
        name="max_score"
        onChange={handleChange}
      />

      <label style={{ fontWeight: "bold" }}>Assigned Date</label>
      <input   style={{ border: "1px solid black" }}
        type="date"
        name="assigned_at"
        value={form.assigned_at || ""}
        onChange={handleChange}
      />

      <button type="submit" style={{ padding: "10px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
        Save Grade
      </button>
    </form>
  );
}
