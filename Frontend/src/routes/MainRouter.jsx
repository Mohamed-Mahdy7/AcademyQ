import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./../components/ProtectedRoute";
import Dashboard from "./../pages/Dashboard";
import Register from "./../pages/RegisterPage";
import Login from "./../pages/LoginPage";
import AcademyProfile from "./../pages/SettingsPage";
import TeachersPage from "./../pages/TeachersPage";
import AttendanceMarkingPage from "./../pages/attendance/AttendanceMarkingPage";
import Sidebar from "./../components/Sidebar";
import DashboarLayout from "./../components/DashboardLayout";
import { AuthContext } from "./../context/AuthContext";
import SubjectsPage from "./../pages/SubjectsPage";
import AddSubjectPage from "./../pages/AddSubjectPage";
import EditSubjectPage from "./../pages/EditSubjectPage";
import ClassesPage from "./../pages/ClassesPage";
import AddClassPage from "./../pages/AddClassPage";
import EditClassPage from "./../pages/EditClassPage";
import GradeForm from "./../components/grades/gradeform";
import GradeHistoryTab from "./../components/grades/GradeHistoryTab";
import GradeSummaryTab from "./../components/grades/ClassGradeSummaryTab";


const MainRouter = () => {
    return (
        <Routes>
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            <Route element={<DashboarLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/settings" element={
                    <ProtectedRoute>
                        <AcademyProfile />
                    </ProtectedRoute>
                } />
                <Route path="teacher" element={
                    <ProtectedRoute>
                        <TeachersPage />
                    </ProtectedRoute>
                } />
                <Route path="classes/:classId/attendance" element={
                    <ProtectedRoute>
                        <AttendanceMarkingPage />
                    </ProtectedRoute>
                } />
                <Route path="/subjects" element={
                    <ProtectedRoute>
                        <SubjectsPage />
                    </ProtectedRoute>
                } />
                <Route path="/subjects/add" element={
                    <ProtectedRoute>
                        <AddSubjectPage />
                    </ProtectedRoute>
                } />
                <Route path="/subjects/:id/edit" element={
                    <ProtectedRoute>
                        <EditSubjectPage />
                    </ProtectedRoute>
                } />
                <Route path="/classes" element={
                    <ProtectedRoute>
                        <ClassesPage />
                    </ProtectedRoute>
                } />
                <Route path="/classes/add" element={
                    <ProtectedRoute>
                        <AddClassPage />
                    </ProtectedRoute>}
                />
                <Route path="/classes/:id/edit" element={
                    <ProtectedRoute>
                        <EditClassPage />
                    </ProtectedRoute>
                }/>
                <Route path="/grade" element={
                    <ProtectedRoute>
                        <GradeForm />
                    </ProtectedRoute>
                } />
                <Route path="/grade/history" element={
                    <ProtectedRoute>
                        <GradeHistoryTab />
                    </ProtectedRoute>
                } />
                <Route path="/grade/summary" element={
                    <ProtectedRoute>
                        <GradeSummaryTab />
                    </ProtectedRoute>
                } />
            </Route>
        </Routes>
    )
}
export default MainRouter;