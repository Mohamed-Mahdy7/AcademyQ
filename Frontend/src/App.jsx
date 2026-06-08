import "./App.css";
import { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Register from "./pages/RegisterPage";
import Login from "./pages/LoginPage";
import TeachersPage from "./pages/TeachersPage";
import AttendanceMarkingPage from "./pages/attendance/AttendanceMarkingPage";
import GradeForm from "./components/grades/gradeform";
import { AuthContext } from "./context/AuthContext";


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
        <Route path="grades" element={
          <ProtectedRoute>
            <GradeForm />
          </ProtectedRoute>
        }/>
      </Routes>
    </>
  )
}

export default App;
