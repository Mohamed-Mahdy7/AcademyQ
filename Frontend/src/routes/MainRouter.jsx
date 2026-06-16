import { Routes, Route } from "react-router-dom";
import { AcademyProvider } from "../context/AcademyContext.jsx";
import { TeacherProvider } from "../context/TeachersContext.jsx";
import { GradeProvider } from "../context/gradecontext.jsx";
import { UsersProvider } from "../context/UsersContext.jsx";
import { StudentProvider } from "../context/StudentsContext.jsx";
import { PaymentProvider } from "../context/PaymentContext.jsx";
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
                <Route path="/settings" element={
                    <ProtectedRoute>
                        <AcademyProvider>
                            <AcademyProfile />
                        </AcademyProvider>
                    </ProtectedRoute>
                } />
                <Route path="teacher" element={
                    <ProtectedRoute>
                        <TeacherProvider>
                            <TeachersPage />
                        </TeacherProvider>
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
                <Route path="/classes/:id" element={
                    <ProtectedRoute>
                        <EnrollmentProvider>
                            <ClassDetailPage />
                        </EnrollmentProvider>
                    </ProtectedRoute>
                } />
                <Route path="/classes/:id/edit" element={
                    <ProtectedRoute>
                        <EditClassPage />
                    </ProtectedRoute>
                } />
                <Route path="/grade" element={
                    <ProtectedRoute>
                        <GradeProvider>
                            <GradeForm />
                        </GradeProvider>
                    </ProtectedRoute>
                } />
                <Route path="/grade/history/:id" element={
                    <ProtectedRoute>
                        <GradeProvider>
                            <GradeHistoryTab />
                        </GradeProvider>
                    </ProtectedRoute>
                } />
                <Route path="/grade/summary/:id" element={
                    <ProtectedRoute>
                        <GradeProvider>
                            <GradeSummaryTab />
                        </GradeProvider>
                    </ProtectedRoute>
                } />
                <Route path="/payments" element={
                    <ProtectedRoute>
                        <PaymentProvider>
                            <PaymentsPage />
                        </PaymentProvider>
                    </ProtectedRoute>
                } />
                <Route path="/users" element={
                    <ProtectedRoute>
                        <UsersProvider>
                            <UserManagement />
                        </UsersProvider>
                    </ProtectedRoute>
                } />
                <Route path="/students" element={
                    <ProtectedRoute>
                        <UsersProvider>
                            <StudentProvider>
                                <StudentManagement />
                            </StudentProvider>
                        </UsersProvider>
                    </ProtectedRoute>
                } />
                <Route path="/student/:id" element={
                    <ProtectedRoute>
                        <StudentProvider>
                            <EnrollmentProvider>
                                <PaymentProvider>
                                    <GradeProvider>
                                        <StudentProfile />
                                    </GradeProvider>
                                </PaymentProvider>
                            </EnrollmentProvider>
                        </StudentProvider>
                    </ProtectedRoute>
                } />
                <Route path="/student/update/:id" element={
                    <ProtectedRoute>
                            <StudentProvider>
                                <EditStudentProfile />
                            </StudentProvider>
                    </ProtectedRoute>
                } />
                <Route path="/user/update/:id" element={
                    <ProtectedRoute>
                        <UsersProvider>
                            <EditUserProfile />
                        </UsersProvider>
                    </ProtectedRoute>
                } />
                <Route path="/reports" element={
                    <ProtectedRoute>
                        <ReportHistoryPage />
                    </ProtectedRoute>
                } />
                <Route path="/reports/:reportId" element={
                    <ProtectedRoute>
                        <ReportCardPage />
                    </ProtectedRoute>
                } />
            </Route>
        </Routes>
    )
}
export default MainRouter;