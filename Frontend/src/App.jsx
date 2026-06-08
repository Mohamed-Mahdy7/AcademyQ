import "./App.css";
import { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Register from "./pages/RegisterPage";
import Login from "./pages/LoginPage";
import TeachersPage from "./pages/TeachersPage";
import AttendanceMarkingPage from "./pages/attendance/AttendanceMarkingPage";
// import GradeForm from "./components/gradeform";
import { AuthContext } from "./context/AuthContext";
import SubjectsPage from "./pages/SubjectsPage";
import AddSubjectPage from "./pages/AddSubjectPage";
import EditSubjectPage from "./pages/EditSubjectPage";


function App() {
  const { loading } = useContext(AuthContext);
  
      if (loading) {
          return <p>Loading...</p>;
      }
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route  path="register" element={<Register />} />
        <Route path="login" element={<Login />} />
        <Route path="teacher" element={
          <ProtectedRoute>
            <TeachersPage />
          </ProtectedRoute>
        } />
        <Route path="attendance" element={
          <ProtectedRoute>
            <AttendanceMarkingPage />
          </ProtectedRoute>
        } />
        <Route
          path="subjects"
          element={
            <ProtectedRoute>
              <SubjectsPage />
            </ProtectedRoute>
          }
        />
        <Route path="subjects/add" element={
            <ProtectedRoute>
              <AddSubjectPage />
            </ProtectedRoute>
          } />
        <Route path="/subjects/:id/edit" element={
            <ProtectedRoute>
              <EditSubjectPage />
            </ProtectedRoute>
          } />
        {/* <Routes path="grade" element={
          <ProtectedRoute>
            <GradeForm />
          </ProtectedRoute>
        }/> */}
      </Routes>
    </>
  )
}

export default App;
