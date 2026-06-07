 import "./App.css";
import GradeForm from "./components/gradeform";

function App() {
  const fakeSubmit = (data) => {
    console.log("FORM DATA:", data);
    alert("Submitted!");
  };

  return (
    <div>
      <GradeForm
        enrollments={[
          { id: 1, student_name: "John Doe" },
          { id: 2, student_name: "Jane Smith" },
        ]}
        sessions={[
          { id: 1, title: "Session 1" },
          { id: 2, title: "Session 2" },
        ]}
        subjectName="Mathematics"
        onSubmit={fakeSubmit}
      />
    </div>
  );
}

export default App;