import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getClass,
    getClassSessions,
} from "../../services/classService";
import SessionsTab from "../../components/attendance/SessionsTab";
import TeachersTab from "../../components/classes/TeachersTab";
import EnrollmentTab from "../../components/enrollments/EnrollmentTab"

const TABS = ["Students", "Sessions", "Grades", "Teachers"];

function ClassDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [activeTab, setActiveTab] = useState("Students");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [classRes, sessionsRes] =
                    await Promise.all([
                        getClass(id),
                        getClassSessions(id),
                    ]);
                setClassData(classRes.data);
                setSessions(sessionsRes.data);
            } catch (error) {
                console.error("Error loading class detail:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [id]);

    if (loading) return <p className="p-6 text-sm text-blue">Loading...</p>;
    if (!classData) return <p className="p-6 text-sm text-danger">Class not found.</p>;

    const sessionsDone = classData.sessions_count || 0;
    const sessionsTotal = classData.subject_session_count || 0;
    const progressPercent = sessionsTotal > 0
        ? Math.round((sessionsDone / sessionsTotal) * 100)
        : 0;
    const avgAttendance = classData.avg_attendance
        ? classData.avg_attendance.toFixed(1)
        : "0.0";
    const primaryTeacher = classData.teachers?.[0]?.teacher_name ?? "—";

    return (
        <div className="page-body">

            {/* Page Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3">
                    <button
                        className="btn-icon mt-1"
                        onClick={() => navigate("/classes")}
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="heading-1">{classData.name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-caption flex items-center gap-1">
                                📖 {classData.subject_name}
                            </span>
                            <span className="text-caption flex items-center gap-1">
                                📅 {classData.start_date} - {classData.end_date}
                            </span>
                        </div>
                    </div>
                </div>
                <span className={classData.is_active ? "badge-success" : "badge-muted"}>
                    {classData.is_active ? "Active" : "Inactive"}
                </span>
            </div>

            {/* Stat Cards */}
            <div className="stat-grid mb-6">
                <div className="kpi-card">
                    <p className="kpi-label">Enrolled Students</p>
                    <p className="kpi-value">{classData.students_count ?? "—"}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Session Progress</p>
                    <p className="kpi-value">{sessionsDone}/{sessionsTotal}</p>
                    <div className="progress-md mt-3">
                        <div
                            className="progress-fill-navy"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Avg. Attendance</p>
                    <p className="kpi-value">{avgAttendance}%</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Teacher</p>
                    <p className="text-base font-semibold text-navy mt-1">
                        {primaryTeacher}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="card">
                <div className="tab-bar px-5">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            className={activeTab === tab ? "tab-active" : "tab"}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    {activeTab === "Students" && (
                        <EnrollmentTab classId={id} />
                    )}
                    {activeTab === "Sessions" && (
                        <SessionsTab sessions={sessions} classId={id} />
                    )}
                    {activeTab === "Grades" && (
                        <div className="empty-state">
                            <p className="empty-state-title">Grades coming soon</p>
                            <p className="empty-state-desc">
                                Grade tracking will be available here.
                            </p>
                        </div>
                    )}
                    {activeTab === "Teachers" && (
                        <TeachersTab teachers={classData.teachers ?? []} classId={id} onUpdate={() => {
                            getClass(id).then(res => setClassData(res.data));
                        }} />
                    )}
                </div>
            </div>

        </div>
    );
}

/* ── Students Tab ─────────────────────────────────────────── */
function StudentsTab({ enrollments }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="heading-3">
                    Enrolled Students ({enrollments.length})
                </h3>
                <a href="#" className="btn-primary">Enroll Student</a>
            </div>

            <table className="table">
                <thead className="table-thead">
                    <tr>
                        <th>Student Name</th>
                        <th>Status</th>
                        <th>Monthly Fee</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {enrollments.length === 0 ? (
                        <tr>
                            <td colSpan={4}>
                                <div className="empty-state">
                                    <p className="empty-state-title">No students enrolled</p>
                                    <p className="empty-state-desc">
                                        Enroll the first student to get started.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        enrollments.map((enrollment) => (
                            <tr key={enrollment.id} className="table-row">
                                <td className="table-cell font-medium">
                                    {enrollment.student_name}
                                </td>
                                <td className="table-cell">
                                    <span className={
                                        enrollment.status === "active"
                                            ? "badge-success"
                                            : enrollment.status === "dropped"
                                                ? "badge-danger"
                                                : "badge-warning"
                                    }>
                                        {enrollment.status}
                                    </span>
                                </td>
                                <td className="table-cell">
                                    {enrollment.fee_amount} EGP
                                </td>
                                <td className="table-actions">
                                    <a href="#" className="btn-secondary">View Profile</a>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default ClassDetailPage;