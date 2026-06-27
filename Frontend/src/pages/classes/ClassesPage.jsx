import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getClasses, deleteClass } from "../../services/classService";
import { toast } from "../../lib/toastBus";

function ClassesPage() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const navigate = useNavigate();

    const targetClass = useMemo(
        () => classes.find((c) => c.id === deleteTargetId),
        [classes, deleteTargetId]
    );

    const stats = useMemo(() => ({
        activeClasses: classes.filter((c) => c.is_active).length,
        totalEnrollments: classes.reduce((sum, c) => sum + (c.students_count || 0), 0),
        sessionsThisWeek: classes.reduce((sum, c) => sum + (c.sessions_this_week || 0), 0),
        avgCompletion: classes.length > 0
            ? Math.round(
                classes.reduce((sum, c) => {
                    const total = c.session_count || 0;
                    const done = c.sessions_count || 0;
                    return sum + (total ? (done / total) * 100 : 0);
                }, 0) / classes.length
            )
            : 0,
    }), [classes]);

    const loadClasses = useCallback(async () => {
        try {
            const response = await getClasses();
            setClasses(response.data);
        } catch {
            toast.danger("Failed to load classes", "Please refresh the page.");
        } finally {
            setLoading(false);
        }
    }, []);

    const closeModal = useCallback(() => {
        setDeleteTargetId(null);
        setDeleteError("");
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        setDeleting(true);
        setDeleteError("");
        try {
            await deleteClass(deleteTargetId);
            setClasses((prev) => prev.filter((c) => c.id !== deleteTargetId));
            toast.success("Class deleted", "The class has been removed successfully.");
            closeModal();
        } catch (error) {
            const rawDetail = error.response?.data?.detail || "";

            const message = rawDetail.includes("referenced by other records")
                ? "This class has enrollments or sessions linked to it. Remove them first before deleting."
                : rawDetail || "Something went wrong. Please try again.";

            setDeleteError(message);
        } finally {
            setDeleting(false);
        }
    }, [deleteTargetId, closeModal]);

    useEffect(() => {
        loadClasses();
    }, [loadClasses]);

    if (loading)
        return <p className="p-6 text-sm text-blue">Loading...</p>;

    return (
        <div className="page-body">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="heading-1">Classes</h1>
                    <p className="subheading">Manage class schedules, enrollments, and sessions</p>
                </div>
                <button className="btn-primary" onClick={() => navigate("/classes/add")}>
                    + Create Class
                </button>
            </div>

            <div className="stat-grid mb-6">
                <div className="kpi-card">
                    <p className="kpi-label">Active Classes</p>
                    <p className="kpi-value">{stats.activeClasses}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Total Enrollments</p>
                    <p className="kpi-value">{stats.totalEnrollments}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Sessions This Week</p>
                    <p className="kpi-value">{stats.sessionsThisWeek}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Avg. Completion</p>
                    <p className="kpi-value">{stats.avgCompletion}%</p>
                </div>
            </div>

            {classes.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-state-title">No classes yet</p>
                    <p className="empty-state-desc">Create your first class to get started.</p>
                    <button className="btn-primary" onClick={() => navigate("/classes/add")}>
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
                            onDelete={() => {
                                setDeleteError("");
                                setDeleteTargetId(cls.id);
                            }}
                        />
                    ))}
                </div>
            )}

            {deleteTargetId && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">Delete Class</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-body">
                                Are you sure you want to delete{" "}
                                <strong>{targetClass?.name}</strong>? This action cannot be undone.
                            </p>
                            {deleteError && (
                                <div className="alert-warning mt-3">
                                    <p className="alert-desc">{deleteError}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-muted" onClick={closeModal}>Cancel</button>
                            <button
                                className="btn-danger"
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete"}
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
    const progress = total ? Math.round((done / total) * 100) : 0;

    return (
        <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="heading-3 truncate">{cls.name}</p>
                    <span className="badge-tag mt-1">{cls.subject_name}</span>
                </div>
                {cls.is_active && (
                    <span className="w-2.5 h-2.5 rounded-full bg-success mt-1.5" />
                )}
            </div>

            <div className="divider my-0" />

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <p className="text-label">Enrolled</p>
                    <p className="text-sm font-semibold">{cls.students_count ?? "—"}</p>
                </div>
                <div>
                    <p className="text-label">Teacher</p>
                    <p className="text-sm font-semibold truncate">{cls.teacher_name ?? "—"}</p>
                </div>
            </div>

            <div>
                <div className="flex justify-between mb-1">
                    <p className="text-label">Progress</p>
                    <p className="text-xs text-blue">{done}/{total}</p>
                </div>
                <div className="progress-md">
                    <div className="progress-fill-navy" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <p className="text-caption">{cls.start_date} - {cls.end_date}</p>

            <div className="flex gap-2 mt-auto">
                <button className="btn-secondary flex-1" onClick={onViewDetails}>View Details</button>
                <button className="btn-icon" onClick={onEdit}>✎</button>
                <button className="btn-icon" onClick={onDelete}>🗑</button>
            </div>
        </div>
    );
}

export default ClassesPage;