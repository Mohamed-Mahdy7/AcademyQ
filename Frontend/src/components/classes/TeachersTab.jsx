import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getTeachers } from "../../services/teachers";
import { assignTeacher, removeTeacher } from "../../services/classService";

function TeachersTab({ teachers, classId, onUpdate }) {
    const { t } = useTranslation(["classes", "common"]);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [removeTargetId, setRemoveTargetId] = useState(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState("");
    const [assignError, setAssignError] = useState(null);
    const [removeError, setRemoveError] = useState(null);
    const [assigning, setAssigning] = useState(false);
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        if (!showAssignModal) return;
        const assigned = teachers.map((teacher) => teacher.teacher_id);
        getTeachers().then((res) => {
            const available = res.data.filter((teacher) => !assigned.includes(teacher.id));
            setAvailableTeachers(available);
            setSelectedTeacherId(available[0]?.id || "");
        });
    }, [showAssignModal, teachers]);

    const closeAssignModal = () => {
        setShowAssignModal(false);
        setAssignError(null);
    };

    const closeRemoveModal = () => {
        setRemoveTargetId(null);
        setRemoveError(null);
    };

    const handleAssign = async () => {
        if (!selectedTeacherId) return;
        setAssigning(true);
        try {
            await assignTeacher(classId, selectedTeacherId);
            closeAssignModal();
            onUpdate();
        } catch (err) {
            setAssignError(err.response?.data?.detail || t("failed_to_assign_teacher"));
        } finally {
            setAssigning(false);
        }
    };

    const handleRemoveConfirm = async () => {
        setRemoving(true);
        try {
            await removeTeacher(classId, removeTargetId);
            closeRemoveModal();
            onUpdate();
        } catch (err) {
            setRemoveError(err.response?.data?.detail || t("failed_to_remove_teacher"));
        } finally {
            setRemoving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="heading-3">{t("assigned_teachers")}</h3>
                <button className="btn-primary" onClick={() => setShowAssignModal(true)}>
                    {t("assign_teacher")}
                </button>
            </div>

            <table className="table">
                <thead className="table-thead">
                    <tr>
                        <th>{t("teacher_name")}</th>
                        <th>{t("assigned_date")}</th>
                        <th>{t("common:actions")}</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.length === 0 ? (
                        <tr>
                            <td colSpan={3}>
                                <div className="empty-state">
                                    <p className="empty-state-title">{t("no_teachers_assigned")}</p>
                                    <p className="empty-state-desc">{t("no_teachers_assigned_desc")}</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        teachers.map((teacher) => (
                            <tr key={teacher.teacher_id} className="table-row">
                                <td className="table-cell font-medium">{teacher.teacher_name}</td>
                                <td className="table-cell-muted">{teacher.assigned_at ?? "—"}</td>
                                <td className="table-actions">
                                    <button
                                        className="btn-danger-outline"
                                        onClick={() => setRemoveTargetId(teacher.teacher_id)}
                                    >
                                        {t("remove")}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {showAssignModal && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">{t("assign_teacher")}</h3>
                        </div>
                        <div className="modal-body">
                            {availableTeachers.length === 0 ? (
                                <p className="text-body-muted">{t("all_teachers_assigned")}</p>
                            ) : (
                                <div className="form-field">
                                    <label className="form-label">{t("select_teacher")}</label>
                                    <select
                                        className="form-select"
                                        value={selectedTeacherId}
                                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    >
                                        {availableTeachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {assignError && <p className="form-error mt-2">{assignError}</p>}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-muted" onClick={closeAssignModal}>
                                {t("common:cancel")}
                            </button>
                            {availableTeachers.length > 0 && (
                                <button
                                    className="btn-primary"
                                    onClick={handleAssign}
                                    disabled={assigning}
                                >
                                    {assigning ? t("assigning") : t("assign")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {removeTargetId && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">{t("remove_teacher")}</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-body">{t("remove_teacher_confirm")}</p>
                            {removeError && (
                                <div className="alert-warning mt-3">
                                    <p className="alert-desc">{removeError}</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-muted" onClick={closeRemoveModal}>
                                {t("common:cancel")}
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleRemoveConfirm}
                                disabled={removing}
                            >
                                {removing ? t("removing") : t("remove")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeachersTab;