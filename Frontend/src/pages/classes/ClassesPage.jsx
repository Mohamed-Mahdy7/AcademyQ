import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getClasses, deleteClass } from "../../services/classService";
import { toast } from "../../lib/toastBus";

function ClassesPage() {
    const { t } = useTranslation(["classes", "common"]);
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
            toast.danger(
                t("failed_to_load_classes"),
                t("common:refresh_page")
            );
        } finally {
            setLoading(false);
        }
    }, [t]);

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
            toast.success(t("class_deleted"), t("class_deleted_desc"));
            closeModal();
        } catch (error) {
            const rawDetail = error.response?.data?.detail || "";
            const message = rawDetail.includes("referenced by other records")
                ? t("delete_class_has_records")
                : rawDetail.replace(/\s*\[ref:[^\]]+\]/, "").trim() || t("common:something_wrong");
            setDeleteError(message);
        } finally {
            setDeleting(false);
        }
    }, [deleteTargetId, closeModal, t]);

    useEffect(() => {
        loadClasses();
    }, [loadClasses]);

    if (loading)
        return <p className="p-6 text-sm text-blue">{t("common:loading")}</p>;

    return (
        <div className="page-body">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="heading-1">{t("classes")}</h1>
                    <p className="subheading">{t("manage_classes_desc")}</p>
                </div>
                <button className="btn-primary" onClick={() => navigate("/classes/add")}>
                    + {t("create_class")}
                </button>
            </div>

            <div className="stat-grid mb-6">
                <div className="kpi-card">
                    <p className="kpi-label">{t("active_classes")}</p>
                    <p className="kpi-value">{stats.activeClasses}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">{t("total_enrollments")}</p>
                    <p className="kpi-value">{stats.totalEnrollments}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">{t("sessions_this_week")}</p>
                    <p className="kpi-value">{stats.sessionsThisWeek}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">{t("avg_completion")}</p>
                    <p className="kpi-value">{stats.avgCompletion}%</p>
                </div>
            </div>

            {classes.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-state-title">{t("no_classes_yet")}</p>
                    <p className="empty-state-desc">{t("no_classes_desc")}</p>
                    <button className="btn-primary" onClick={() => navigate("/classes/add")}>
                        + {t("create_class")}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls) => (
                        <ClassCard
                            key={cls.id}
                            cls={cls}
                            t={t}
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
                            <h3 className="modal-title">{t("delete_class")}</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-body">
                                {t("common:are_you_sure_delete")}{" "}
                                <strong>{targetClass?.name}</strong>?{" "}
                                {t("common:delete_confirm")}
                            </p>
                            {deleteError && (
                                <div className="alert-warning mt-3">
                                    <p className="alert-desc">{deleteError}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-muted" onClick={closeModal}>
                                {t("common:cancel")}
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                            >
                                {deleting ? t("common:deleting") : t("common:delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ClassCard({ cls, t, onViewDetails, onEdit, onDelete }) {
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
                    <p className="text-label">{t("enrolled")}</p>
                    <p className="text-sm font-semibold">{cls.students_count ?? "—"}</p>
                </div>
                <div>
                    <p className="text-label">{t("teacher")}</p>
                    <p className="text-sm font-semibold truncate">{cls.teacher_name ?? "—"}</p>
                </div>
            </div>

            <div>
                <div className="flex justify-between mb-1">
                    <p className="text-label">{t("progress")}</p>
                    <p className="text-xs text-blue">{done}/{total}</p>
                </div>
                <div className="progress-md">
                    <div className="progress-fill-navy" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <p className="text-caption">{cls.start_date} - {cls.end_date}</p>

            <div className="flex gap-2 mt-auto">
                <button className="btn-secondary flex-1" onClick={onViewDetails}>
                    {t("view_details")}
                </button>
                <button className="btn-icon" onClick={onEdit}>✎</button>
                <button className="btn-icon" onClick={onDelete}>🗑</button>
            </div>
        </div>
    );
}

export default ClassesPage;