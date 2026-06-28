import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    getClass,
    getClassSessions,
    getClassEnrollments,
} from "../../services/classService";
import ScheduleSection from "../../components/classes/ScheduleSection";
import SessionsTab from "../../components/attendance/SessionsTab";
import TeachersTab from "../../components/classes/TeachersTab";
import EnrollmentTab from "../../components/enrollments/EnrollmentTab";
import GradesTabContent from "../../components/grades/GradesTabContent";
import ClassReportsTab from "../../components/reports/ClassReportsTab";
import { toast } from "../../lib/toastBus";

function ClassDetailPage() {
    const { t } = useTranslation(["classes", "common"]);
    const { id } = useParams();
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [activeTab, setActiveTab] = useState("Students");
    const [loading, setLoading] = useState(true);

    // ── Tabs defined with translation ───────────────────────────────
    const TABS = useMemo(() => [
        { key: "Students",  label: t("students") },
        { key: "Sessions",  label: t("sessions") },
        { key: "Grades",    label: t("common:grades") },
        { key: "Teachers",  label: t("teachers") },
        { key: "AI Reports", label: t("ai_reports") },
    ], [t]);

    const fetchAll = useCallback(async () => {
        try {
            const [classRes, sessionsRes, enrollmentsRes] = await Promise.all([
                getClass(id),
                getClassSessions(id),
                getClassEnrollments(id),
            ]);
            setClassData(classRes.data);
            setSessions(sessionsRes.data.results ?? sessionsRes.data);
            setEnrollments(enrollmentsRes.data.results ?? enrollmentsRes.data);
        } catch {
            toast.danger(
                t("unable_to_load_class"),
                t("class_load_failed_desc")
            );
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const derived = useMemo(() => {
        if (!classData) return {};
        const sessionsDone = classData.sessions_count || 0;
        const sessionsTotal = classData.session_count || 0;
        return {
            sessionsDone,
            sessionsTotal,
            progressPercent: sessionsTotal > 0
                ? Math.round((sessionsDone / sessionsTotal) * 100)
                : 0,
            avgAttendance: classData.avg_attendance
                ? classData.avg_attendance.toFixed(1)
                : "0.0",
            primaryTeacher: classData.teachers?.[0]?.teacher_name ?? "—",
        };
    }, [classData]);

    if (loading)
        return <p className="p-6 text-sm text-blue">{t("common:loading")}</p>;

    if (!classData)
        return (
            <div className="page-body">
                <div className="flex items-center gap-3 mb-6">
                    <button className="btn-icon" onClick={() => navigate("/classes")}>←</button>
                    <h1 className="heading-1">{t("class_detail")}</h1>
                </div>
                <div className="card-body">
                    <p className="text-sm text-danger">{t("class_not_found_desc")}</p>
                </div>
            </div>
        );

    const { sessionsDone, sessionsTotal, progressPercent, avgAttendance, primaryTeacher } = derived;

    return (
        <div className="page-body">

            {/* Page Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-3">
                    <button className="btn-icon mt-1" onClick={() => navigate("/classes")}>
                        ←
                    </button>
                    <div>
                        <h1 className="heading-1">{classData.name}</h1>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-caption">{classData.subject_name}</span>
                            <span className="text-caption">{classData.start_date} - {classData.end_date}</span>
                            {classData.class_price && (
                                <span className="text-caption">{classData.class_price} EGP</span>
                            )}
                        </div>
                    </div>
                </div>
                <span className={classData.is_active ? "badge-success" : "badge-muted"}>
                    {classData.is_active ? t("common:active") : t("inactive")}
                </span>
            </div>

            {/* Stat Cards */}
            <div className="stat-grid mb-6">
                <div className="kpi-card">
                    <p className="kpi-label">{t("enrolled_students")}</p>
                    <p className="kpi-value">{classData.students_count ?? "—"}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">{t("session_progress")}</p>
                    <p className="kpi-value">{sessionsDone}/{sessionsTotal}</p>
                    <div className="progress-md mt-3">
                        <div
                            className="progress-fill-navy"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">{t("avg_attendance")}</p>
                    <p className="kpi-value">{avgAttendance}%</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">{t("teacher")}</p>
                    <p className="text-base font-semibold text-navy mt-1">{primaryTeacher}</p>
                </div>
            </div>

            {/* Schedule Section */}
            <ScheduleSection
                classId={id}
                sessionDuration={classData.session_duration}
                onUpdate={fetchAll}
            />

            {/* Tabs */}
            <div className="card">
                <div className="tab-bar px-5">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            className={activeTab === tab.key ? "tab-active" : "tab"}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    {activeTab === "Students" && (
                        <EnrollmentTab classId={id} onUpdate={fetchAll} />
                    )}
                    {activeTab === "Sessions" && (
                        <SessionsTab
                            sessions={sessions}
                            classId={id}
                            classStartDate={classData.start_date}
                            classEndDate={classData.end_date}
                            onSessionsGenerated={fetchAll}
                        />
                    )}
                    {activeTab === "Grades" && (
                        <GradesTabContent
                            classId={id}
                            enrollments={enrollments}
                            sessions={sessions}
                            subjectName={classData.subject_name}
                            onUpdate={fetchAll}
                        />
                    )}
                    {activeTab === "Teachers" && (
                        <TeachersTab
                            teachers={classData.teachers ?? []}
                            classId={id}
                            onUpdate={fetchAll}
                        />
                    )}
                    {activeTab === "AI Reports" && (
                        <ClassReportsTab classId={id} enrollments={enrollments} />
                    )}
                </div>
            </div>

        </div>
    );
}

export default ClassDetailPage;