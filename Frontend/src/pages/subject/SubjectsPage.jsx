import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSubjects, deleteSubject } from "../../services/subjectService";
import { toast } from "../../lib/toastBus";

function SubjectsPage() {
    const { t } = useTranslation(["subjects", "common"]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    const navigate = useNavigate();

    const { totalSubjects, totalClasses } = useMemo(() => ({
        totalSubjects: subjects.length,
        totalClasses: subjects.reduce((sum, s) => sum + (s.classes_count || 0), 0),
    }), [subjects]);

    const targetSubject = useMemo(
        () => subjects.find((s) => s.id === deleteTargetId),
        [subjects, deleteTargetId]
    );

    const targetHasClasses = useMemo(
        () => (targetSubject?.classes_count || 0) > 0,
        [targetSubject]
    );

    const loadSubjects = useCallback(async () => {
        try {
            const response = await getSubjects();
            setSubjects(response.data);
        } catch {
            toast.danger(
                t("failed_to_load_subjects"),
                t("refresh_page")
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
        if (targetHasClasses) {
            setDeleteError(
                t("delete_subject_has_classes", {
                    count: targetSubject.classes_count,
                })
            );
            return;
        }

        setDeleting(true);
        try {
            await deleteSubject(deleteTargetId);
            setSubjects((prev) => prev.filter((s) => s.id !== deleteTargetId));
            toast.success(
                t("subject_deleted"),
                t("subject_deleted_desc")
            );
            closeModal();
        } catch {
            toast.danger(
                t("delete_failed"),
                t("subject_delete_failed_desc")
            );
        } finally {
            setDeleting(false);
        }
    }, [deleteTargetId, targetSubject, targetHasClasses, closeModal, t]);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    if (loading)
        return <p className="p-6 text-sm text-blue">{t("loading")}</p>;

    return (
        <div className="page-body">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="heading-1">{t("subjects")}</h1>
                    <p className="subheading">{t("manage_subjects_desc")}</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => navigate("/subjects/add")}
                >
                    + {t("add_subject")}
                </button>
            </div>

            <div className="stat-grid mb-6">
                <div className="kpi-card">
                    <p className="kpi-label">{t("total_subjects")}</p>
                    <p className="kpi-value">{totalSubjects}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">{t("active_classes")}</p>
                    <p className="kpi-value">{totalClasses}</p>
                </div>
            </div>

            <div className="table-wrap">
                <div className="card-header">
                    <h2 className="card-header-title">{t("all_subjects")}</h2>
                </div>

                <table className="table">
                    <thead className="table-thead">
                        <tr>
                            <th>{t("subject_name")}</th>
                            <th>{t("description")}</th>
                            <th>{t("active_classes")}</th>
                            <th>{t("common:status")}</th>
                            <th className="text-end">{t("common:actions")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="empty-state">
                                        <p className="empty-state-title">{t("no_subjects_yet")}</p>
                                        <p className="empty-state-desc">{t("no_subjects_desc")}</p>
                                        <button
                                            className="btn-primary"
                                            onClick={() => navigate("/subjects/add")}
                                        >
                                            + {t("add_subject")}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            subjects.map((subject) => (
                                <tr key={subject.id} className="table-row">
                                    <td className="table-cell font-medium">
                                        {subject.name}
                                    </td>
                                    <td className="table-cell-muted">
                                        {subject.description || "—"}
                                    </td>
                                    <td className="table-cell">
                                        <span className="badge-count">
                                            {t("classes_count_label", {
                                                count: subject.classes_count,
                                            })}
                                        </span>
                                    </td>
                                    <td className="table-cell">
                                        <span className="badge-success">{t("common:active")}</span>
                                    </td>
                                    <td className="table-actions">
                                        <button
                                            className="btn-secondary"
                                            onClick={() =>
                                                navigate(`/subjects/${subject.id}/edit`)
                                            }
                                        >
                                            {t("edit")}
                                        </button>
                                        <button
                                            className="btn-danger-outline"
                                            onClick={() => {
                                                setDeleteError("");
                                                setDeleteTargetId(subject.id);
                                            }}
                                        >
                                            {t("delete")}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {deleteTargetId && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">{t("delete_subject")}</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-body">
                                {t("are_you_sure_delete")}{" "}
                                <strong>{targetSubject?.name}</strong>?{" "}
                                {t("delete_confirm")}
                            </p>
                            {deleteError && (
                                <div className="alert-warning mt-3">
                                    <p className="alert-desc">{deleteError}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-muted" onClick={closeModal}>
                                {t("cancel")}
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                            >
                                {deleting ? t("deleting") : t("delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SubjectsPage;