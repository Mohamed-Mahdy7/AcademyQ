import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClasses, deleteClass } from "../../services/classService";

function ClassesPage() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            const response = await getClasses();
            setClasses(response.data);
        } catch (error) {
            console.error("Error loading classes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteClass(deleteTargetId);
            setClasses((prev) => prev.filter((c) => c.id !== deleteTargetId));
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setDeleteTargetId(null);
        }
    };

    if (loading) return <p className="p-6 text-sm text-blue">Loading...</p>;

    const activeClasses = classes.filter((c) => c.is_active).length;
    const totalEnrollments = classes.reduce((sum, c) => sum + (c.students_count || 0), 0);
    const sessionsThisWeek = classes.reduce((sum, c) => sum + (c.sessions_this_week || 0), 0);
    const avgCompletion =
        classes.length > 0
            ? Math.round(
                classes.reduce((sum, c) => {
                    const total = c.session_count || 0;
                    const done = c.sessions_count || 0;
                    return sum + (total > 0 ? (done / total) * 100 : 0);
                }, 0) / classes.length
            )
            : 0;

    return (
        <div className="page-body">

            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="heading-1">Classes</h1>
                    <p className="subheading">Manage class schedules, enrollments, and sessions</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => navigate("/classes/add")}
                >
                    + Create Class
                </button>
            </div>

            {/* Stat Cards */}
            <div className="stat-grid mb-6">
                <div className="kpi-card">
                    <p className="kpi-label">Active Classes</p>
                    <p className="kpi-value">{activeClasses}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Total Enrollments</p>
                    <p className="kpi-value">{totalEnrollments}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Sessions This Week</p>
                    <p className="kpi-value">{sessionsThisWeek}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Avg. Completion</p>
                    <p className="kpi-value">{avgCompletion}%</p>
                </div>
            </div>

            {/* Class Cards Grid */}
            {classes.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-state-title">No classes yet</p>
                    <p className="empty-state-desc">
                        Create your first class to get started.
                    </p>
                    <button
                        className="btn-primary"
                        onClick={() => navigate("/classes/add")}
                    >
                        + Create Class
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls) => (
                        <ClassCard
                            key={cls.id}
                            cls={cls}
                            onViewDetails={() => navigate(`/classes/${cls.id}`)}
                            onEdit={() => navigate(`/classes/${cls.id}/edit`)}
                            onDelete={() => setDeleteTargetId(cls.id)}
                        />
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTargetId && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">Delete Class</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-body">
                                Are you sure you want to delete this class? This
                                action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-muted"
                                onClick={() => setDeleteTargetId(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleDeleteConfirm}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ClassCard({ cls, onViewDetails, onEdit, onDelete }) {
    const total = cls.session_count || 0;
    const done = cls.sessions_count || 0;
    const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
        <div className="card p-5 flex flex-col gap-4">

            {/* Card Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="heading-3 truncate">{cls.name}</p>
                    <span className="badge-tag mt-1">{cls.subject_name}</span>
                </div>
                {cls.is_active && (
                    <span className="w-2.5 h-2.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                )}
            </div>

            <div className="divider my-0" />

            {/* Enrolled + Teacher */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <p className="text-label mb-0.5">Enrolled</p>
                    <p className="text-sm font-semibold text-navy">
                        {cls.students_count ?? "—"} students
                    </p>
                </div>
                <div>
                    <p className="text-label mb-0.5">Teacher</p>
                    <p className="text-sm font-semibold text-navy truncate">
                        {cls.teacher_name ?? "—"}
                    </p>
                </div>
            </div>

            {/* Progress */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <p className="text-label">Progress</p>
                    <p className="text-xs text-blue">{done}/{total} sessions</p>
                </div>
                <div className="progress-md">
                    <div
                        className="progress-fill-navy"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Date Range */}
            <p className="text-caption">
                {cls.start_date} - {cls.end_date}
            </p>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
                <button
                    className="btn-secondary flex-1"
                    onClick={onViewDetails}
                >
                    View Details
                </button>
                <button className="btn-icon" onClick={onEdit}>✎</button>
                <button className="btn-icon" onClick={onDelete}>🗑</button>
            </div>
        </div>
    );
}

export default ClassesPage;