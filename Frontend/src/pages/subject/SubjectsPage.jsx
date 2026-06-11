import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSubjects, deleteSubject } from "../../services/subjectService";

function SubjectsPage() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        try {
            const response = await getSubjects();
            setSubjects(response.data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteSubject(deleteTargetId);
            setSubjects((prev) => prev.filter((s) => s.id !== deleteTargetId));
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setDeleteTargetId(null);
        }
    };

    if (loading) return <p className="p-6 text-sm text-blue">Loading...</p>;

    const totalSubjects = subjects.length;
    const totalClasses = subjects.reduce((sum, s) => sum + (s.classes_count || 0), 0);

    return (
        <div className="page-body">

            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="heading-1">Subjects</h1>
                    <p className="subheading">Manage subject curriculum and class offerings</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => navigate("/subjects/add")}
                >
                    + Add Subject
                </button>
            </div>

            {/* Stat Cards */}
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

            {/* Table Card */}
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
                                <td colSpan={6}>
                                    <div className="empty-state">
                                        <p className="empty-state-title">No subjects yet</p>
                                        <p className="empty-state-desc">
                                            Add your first subject to get started.
                                        </p>
                                        <button
                                            className="btn-primary"
                                            onClick={() => navigate("/subjects/add")}
                                        >
                                            + Add Subject
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
                                            {subject.classes_count} classes
                                        </span>
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
                                            onClick={() => setDeleteTargetId(subject.id)}
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

            {/* Delete Confirmation Modal */}
            {deleteTargetId && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">Delete Subject</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-body">
                                Are you sure you want to delete this subject? This action
                                cannot be undone.
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

export default SubjectsPage;