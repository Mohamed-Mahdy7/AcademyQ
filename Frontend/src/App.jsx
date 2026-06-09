import "./App.css";
import { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/RegisterPage";
import Login from "./pages/LoginPage";
import AcademyProfile from "./pages/SettingsPage";
import TeachersPage from "./pages/TeachersPage";
import AttendanceMarkingPage from "./pages/attendance/AttendanceMarkingPage";
// import GradeForm from "./components/gradeform";
import Sidebar from "./components/Sidebar";
import DashboarLayout from "./components/DashboardLayout";
import { AuthContext } from "./context/AuthContext";
import SubjectsPage from "./pages/SubjectsPage";
import AddSubjectPage from "./pages/AddSubjectPage";
import EditSubjectPage from "./pages/EditSubjectPage";

import ClassesPage from "./pages/ClassesPage";
import AddClassPage from "./pages/AddClassPage";
import EditClassPage from "./pages/EditClassPage";
import MainRouter from "./routes/MainRouter";


function App() {
  const { loading } = useContext(AuthContext);
  
      if (loading) {
          return <p>Loading...</p>;
      }

  return (
    <>
      <MainRouter/>
    </>
  )
}

export default App;
