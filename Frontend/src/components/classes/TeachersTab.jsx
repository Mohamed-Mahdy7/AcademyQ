import { useState, useEffect } from "react";
import { getTeachers } from "../../services/teachers";
import { assignTeacher, removeTeacher } from "../../services/classService";

function TeachersTab({ teachers: initialTeachers, classId, onUpdate }) {
    const [teachers, setTeachers] = useState(initialTeachers);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [removeTargetId, setRemoveTargetId] = useState(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        setTeachers(initialTeachers);
    }, [initialTeachers]);

    useEffect(() => {
        if (showAssignModal) {
            getTeachers().then(res => {
                const assigned = teachers.map(t => t.teacher_id);
                const available = res.data.filter(
                    t => !assigned.includes(t.id)
                );
                setAvailableTeachers(available);
                setSelectedTeacherId(available[0]?.id || "");
            });
        }
    }, [showAssignModal, teachers]);

    const handleAssign = async () => {
        if (!selectedTeacherId) return;
        try {
            await assignTeacher(classId, selectedTeacherId);
            setShowAssignModal(false);
            setError(null);
            onUpdate();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to assign teacher.");
        }
    };

    const handleRemoveConfirm = async () => {
        try {
            await removeTeacher(classId, removeTargetId);
            setRemoveTargetId(null);
            setError(null);
            onUpdate();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to remove teacher.");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="heading-3">Assigned Teachers</h3>
                <button
                    className="btn-primary"
                    onClick={() => setShowAssignModal(true)}
                >
                    Assign Teacher
                </button>
            </div>

            {error && (
                <div className="alert-danger mb-4">
                    <p className="alert-desc">{error}</p>
                </div>
            )}

            <table className="table">
                <thead className="table-thead">
                    <tr>
                        <th>Teacher Name</th>
                        <th>Assigned Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.length === 0 ? (
                        <tr>
                            <td colSpan={3}>
                                <div className="empty-state">
                                    <p className="empty-state-title">No teachers assigned</p>
                                    <p className="empty-state-desc">
                                        Assign a teacher to this class.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        teachers.map((teacher) => (
                            <tr key={teacher.teacher_id} className="table-row">
                                <td className="table-cell font-medium">
                                    {teacher.teacher_name}
                                </td>
                                <td className="table-cell-muted">
                                    {teacher.assigned_at ?? "—"}
                                </td>
                                <td className="table-actions">
                                    <button
                                        className="btn-danger-outline"
                                        onClick={() => setRemoveTargetId(teacher.teacher_id)}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Assign Teacher Modal */}
            {showAssignModal && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">Assign Teacher</h3>
                        </div>
                        <div className="modal-body">
                            {availableTeachers.length === 0 ? (
                                <p className="text-body-muted">
                                    All teachers are already assigned to this class.
                                </p>
                            ) : (
                                <div className="form-field">
                                    <label className="form-label">Select Teacher</label>
                                    <select
                                        className="form-select"
                                        value={selectedTeacherId}
                                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    >
                                        {availableTeachers.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {error && (
                                <p className="form-error mt-2">{error}</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-muted"
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setError(null);
                                }}
                            >
                                Cancel
                            </button>
                            {availableTeachers.length > 0 && (
                                <button
                                    className="btn-primary"
                                    onClick={handleAssign}
                                >
                                    Assign
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Confirmation Modal */}
            {removeTargetId && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">Remove Teacher</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-body">
                                Are you sure you want to remove this teacher from the class?
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-muted"
                                onClick={() => {
                                    setRemoveTargetId(null);
                                    setError(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleRemoveConfirm}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeachersTab;