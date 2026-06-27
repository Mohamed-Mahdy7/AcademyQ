import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getSubjects, deleteSubject } from "../../services/subjectService";
import { toast } from "../../lib/toastBus";

function SubjectsPage() {
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
            toast.danger("Failed to load subjects", "Please refresh the page.");
        } finally {
            setLoading(false);
        }
    }, []);

    const closeModal = useCallback(() => {
        setDeleteTargetId(null);
        setDeleteError("");
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (targetHasClasses) {
            setDeleteError(
                `This subject has ${targetSubject.classes_count} class${
                    targetSubject.classes_count !== 1 ? "es" : ""
                } assigned. Delete or reassign ${
                    targetSubject.classes_count !== 1 ? "them" : "it"
                } before deleting this subject.`
            );
            return;
        }

        setDeleting(true);
        try {
            await deleteSubject(deleteTargetId);
            setSubjects((prev) => prev.filter((s) => s.id !== deleteTargetId));
            toast.success("Subject deleted", "The subject has been removed successfully.");
            closeModal();
        } catch {
            toast.danger("Delete failed", "Something went wrong while deleting the subject.");
        } finally {
            setDeleting(false);
        }
    }, [deleteTargetId, targetSubject, targetHasClasses, closeModal]);

    useEffect(() => {
        loadSubjects();
    }, [loadSubjects]);

    // ── Render ───────────────────────────────────────────────────────
    if (loading) return <p className="p-6 text-sm text-blue">Loading...</p>;

    return (
        <div className="page-body">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="heading-1">Subjects</h1>
                    <p className="subheading">Manage subject curriculum and class offerings</p>
                </div>
                <button className="btn-primary" onClick={() => navigate("/subjects/add")}>
                    + Add Subject
                </button>
            </div>

            <div className="stat-grid mb-6">
                <div className="kpi-card">
                    <p className="kpi-label">Total Subjects</p>
                    <p className="kpi-value">{totalSubjects}</p>
                </div>
                <div className="kpi-card">
                    <p className="kpi-label">Active Classes</p>
                    <p className="kpi-value">{totalClasses}</p>
                </div>
            </div>

            <div className="table-wrap">
                <div className="card-header">
                    <h2 className="card-header-title">All Subjects</h2>
                </div>

                <table className="table">
                    <thead className="table-thead">
                        <tr>
                            <th>Subject Name</th>
                            <th>Description</th>
                            <th>Active Classes</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="empty-state">
                                        <p className="empty-state-title">No subjects yet</p>
                                        <p className="empty-state-desc">Add your first subject to get started.</p>
                                        <button className="btn-primary" onClick={() => navigate("/subjects/add")}>
                                            + Add Subject
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            subjects.map((subject) => (
                                <tr key={subject.id} className="table-row">
                                    <td className="table-cell font-medium">{subject.name}</td>
                                    <td className="table-cell-muted">{subject.description || "—"}</td>
                                    <td className="table-cell">
                                        <span className="badge-count">{subject.classes_count} classes</span>
                                    </td>
                                    <td className="table-cell">
                                        <span className="badge-success">Active</span>
                                    </td>
                                    <td className="table-actions">
                                        <button
                                            className="btn-secondary"
                                            onClick={() => navigate(`/subjects/${subject.id}/edit`)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn-danger-outline"
                                            onClick={() => {
                                                setDeleteError("");
                                                setDeleteTargetId(subject.id);
                                            }}
                                        >
                                            Delete
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
                            <h3 className="modal-title">Delete Subject</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-body">
                                Are you sure you want to delete{" "}
                                <strong>{targetSubject?.name}</strong>? This action cannot be undone.
                            </p>
                            {deleteError && (
                                <div className="alert-warning mt-3">
                                    <p className="alert-desc">{deleteError}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-muted" onClick={closeModal}>
                                Cancel
                            </button>
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

export default SubjectsPage;