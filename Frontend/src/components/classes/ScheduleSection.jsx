import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    getClassSchedule,
    addScheduleSlot,
    deleteScheduleSlot,
} from "../../services/classService";

function ScheduleSection({ classId, sessionDuration, onUpdate }) {
    const { t } = useTranslation(["classes", "common"]);

    const DAYS = [
        { value: 0, label: t("monday") },
        { value: 1, label: t("tuesday") },
        { value: 2, label: t("wednesday") },
        { value: 3, label: t("thursday") },
        { value: 4, label: t("friday") },
        { value: 5, label: t("saturday") },
        { value: 6, label: t("sunday") },
    ];

    const DAY_SHORT = [
        t("monday").slice(0, 3),
        t("tuesday").slice(0, 3),
        t("wednesday").slice(0, 3),
        t("thursday").slice(0, 3),
        t("friday").slice(0, 3),
        t("saturday").slice(0, 3),
        t("sunday").slice(0, 3),
    ];

    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [dayOfWeek, setDayOfWeek] = useState(0);
    const [startTime, setStartTime] = useState("");
    const [error, setError] = useState(null);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const loadSchedules = useCallback(async () => {
        try {
            const res = await getClassSchedule(classId);
            setSchedules(res.data);
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        loadSchedules();
    }, [loadSchedules]);

    const handleAdd = async () => {
        if (!startTime) {
            setError(t("start_time_required"));
            return;
        }
        try {
            await addScheduleSlot({
                class_obj: classId,
                day_of_week: Number(dayOfWeek),
                start_time: startTime,
            });
            setShowAddModal(false);
            setStartTime("");
            setError(null);
            loadSchedules();
            onUpdate?.();
        } catch (err) {
            const data = err.response?.data;
            setError(
                typeof data === "string"
                    ? data
                    : data?.non_field_errors?.[0] ||
                      data?.detail ||
                      t("failed_to_add_slot")
            );
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteScheduleSlot(deleteTargetId);
            setDeleteTargetId(null);
            loadSchedules();
            onUpdate?.();
        } catch {
            setDeleteTargetId(null);
        }
    };

    return (
        <div className="card-body mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="heading-3">{t("weekly_schedule")}</h3>
                <button
                    className="btn-secondary"
                    onClick={() => { setShowAddModal(true); setError(null); }}
                >
                    + {t("add_slot")}
                </button>
            </div>

            {loading ? (
                <p className="text-sm text-blue">{t("loading_schedule")}</p>
            ) : schedules.length === 0 ? (
                <p className="text-sm text-blue">{t("no_schedule_yet")}</p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {schedules.map((slot) => (
                        <div key={slot.id} className="badge-tag flex items-center gap-2">
                            <span>
                                {DAY_SHORT[slot.day_of_week]} {slot.start_time?.slice(0, 5)}
                                {slot.end_time ? ` - ${slot.end_time.slice(0, 5)}` : ""}
                            </span>
                            <button
                                className="text-danger hover:text-danger/70"
                                onClick={() => setDeleteTargetId(slot.id)}
                                title={t("remove")}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showAddModal && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">{t("add_schedule_slot")}</h3>
                        </div>
                        <div className="modal-body">
                            {!sessionDuration && (
                                <div className="alert-warning mb-4">
                                    <p className="alert-desc">{t("no_session_duration_warning")}</p>
                                </div>
                            )}
                            <div className="form-field mb-4">
                                <label className="form-label">{t("day_of_week")}</label>
                                <select
                                    className="form-select"
                                    value={dayOfWeek}
                                    onChange={(e) => setDayOfWeek(e.target.value)}
                                >
                                    {DAYS.map((d) => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">
                                    {t("start_time")} <span className="form-required">*</span>
                                </label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            {error && <p className="form-error mt-2">{error}</p>}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-muted"
                                onClick={() => { setShowAddModal(false); setError(null); }}
                            >
                                {t("common:cancel")}
                            </button>
                            <button className="btn-primary" onClick={handleAdd}>
                                {t("add_slot")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteTargetId && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">{t("remove_schedule_slot")}</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-body">{t("remove_schedule_slot_confirm")}</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-muted" onClick={() => setDeleteTargetId(null)}>
                                {t("common:cancel")}
                            </button>
                            <button className="btn-danger" onClick={handleDeleteConfirm}>
                                {t("remove")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ScheduleSection;