import { Routes, Route } from "react-router-dom";
import { AcademyProvider } from "../context/AcademyContext.jsx";
import { TeacherProvider } from "../context/TeachersContext.jsx";
import { GradeProvider } from "../context/gradecontext.jsx";
import { UsersProvider } from "../context/UsersContext.jsx";
import { StudentProvider } from "../context/StudentsContext.jsx";
import { EnrollmentProvider } from "../context/EnrollmentContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute";
import MainLayout from "../components/DashboardLayout";
import Dashboard from "../pages/Dashboard.jsx";
import AcademyProfile from "../pages/SettingsPage.jsx";
import TeachersPage from "../pages/TeachersPage.jsx";
import PaymentsPage from "../pages/PaymentsPage.jsx";
import Register from "../pages/auth/RegisterPage.jsx";
import Login from "../pages/auth/LoginPage.jsx";
import UserRegister from "../pages/auth/UsersRegisterPage.jsx";
import StudentRegister from "../pages/auth/StudentsRegisterPage.jsx";
import AttendanceMarkingPage from "../pages/attendance/AttendanceMarkingPage.jsx";
import SubjectsPage from "../pages/subject/SubjectsPage.jsx";
import AddSubjectPage from "../pages/subject/AddSubjectPage.jsx";
import EditSubjectPage from "../pages/subject/EditSubjectPage.jsx";
import ClassesPage from "../pages/classes/ClassesPage.jsx";
import AddClassPage from "../pages/classes/AddClassPage.jsx";
import EditClassPage from "../pages/classes/EditClassPage.jsx";
import ClassDetailPage from "../pages/classes/ClassDetailPage.jsx";
import UserManagement from "../pages/users/UserManagementPage.jsx";
import StudentManagement from "../pages/students/StudentManagementpage.jsx";
import GradeForm from "../components/grades/gradeform";
import GradeHistoryTab from "../components/grades/GradeHistoryTab";
import GradeSummaryTab from "../components/grades/ClassGradeSummaryTab";
import StudentProfile from "../pages/students/StudentProfile.jsx";
import EditStudentProfile from "../pages/students/EditStudentProfile.jsx";
import EditUserProfile from "../pages/users/EditUserProfile.jsx";
import ReportHistoryPage from "../pages/reports/ReportHistoryPage";
import ReportCardPage from "../pages/reports/ReportCardPage";


const MainRouter = () => {
    return (
        <Routes>
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route element={<ProtectedRoute></ProtectedRoute>}>
                    <Route path="/settings" element={
                        <AcademyProvider>
                            <AcademyProfile />
                        </AcademyProvider>
                    } />
                    <Route path="teacher" element={
                        <TeacherProvider>
                            <TeachersPage />
                        </TeacherProvider>
                    } />
                    <Route path="classes/:classId/attendance" element={
                        <AttendanceMarkingPage />
                    } />
                    <Route path="/subjects" element={
                        <SubjectsPage />
                    } />
                    <Route path="/subjects/add" element={
                        <AddSubjectPage />
                    } />
                    <Route path="/subjects/:id/edit" element={
                        <EditSubjectPage />
                    } />
                    <Route path="/classes" element={
                        <ClassesPage />
                    } />
                    <Route path="/classes/add" element={
                        <AddClassPage />
                    } />
                    <Route path="/classes/:id/edit" element={
                        <EditClassPage />
                    } />
                    <Route path="/payments" element={
                        <PaymentsPage />
                    } />
                    <Route path="/users" element={
                        <UsersProvider>
                            <UserManagement />
                        </UsersProvider>
                    } />
                    <Route element={<StudentProvider></StudentProvider>}>
                        <Route element={<GradeProvider></GradeProvider>}>
                            <Route element={<EnrollmentProvider></EnrollmentProvider>}>
                                <Route path="/classes/:id" element={
                                    <ClassDetailPage />
                                } />
                                <Route path="/student/:id" element={
                                    <StudentProfile />
                                } />
                            </Route>
                            <Route path="/grade" element={
                                <GradeForm />
                            } />
                            <Route path="/grade/history/:id" element={
                                <GradeHistoryTab />
                            } />
                            <Route path="/grade/summary/:id" element={
                                <GradeSummaryTab />
                            } />
                        </Route>
                        <Route path="/students" element={
                            <UsersProvider>
                                <StudentManagement />
                            </UsersProvider>
                        } />
                        <Route path="/student/update/:id" element={
                            <EditStudentProfile />
                        } />
                    </Route>
                    <Route path="/user/update/:id" element={
                        <UsersProvider>
                            <EditUserProfile />
                        </UsersProvider>
                    } />
                    <Route path="/reports" element={
                        <ReportHistoryPage />
                    } />
                    <Route path="/reports/:reportId" element={
                        <ReportCardPage />
                    } />
                </Route>
            </Route>
        </Routes>
    )
}
export default MainRouter;