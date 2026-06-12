import { useState, useEffect } from "react";
import {
    getClassSchedule,
    addScheduleSlot,
    deleteScheduleSlot,
} from "../../services/classService";

const DAYS = [
    { value: 0, label: "Monday" },
    { value: 1, label: "Tuesday" },
    { value: 2, label: "Wednesday" },
    { value: 3, label: "Thursday" },
    { value: 4, label: "Friday" },
    { value: 5, label: "Saturday" },
    { value: 6, label: "Sunday" },
];

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ScheduleSection({ classId, sessionDuration, onUpdate }) {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [dayOfWeek, setDayOfWeek] = useState(0);
    const [startTime, setStartTime] = useState("");
    const [error, setError] = useState(null);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const loadSchedules = async () => {
        try {
            const res = await getClassSchedule(classId);
            setSchedules(res.data);
        } catch (err) {
            console.error("Error loading schedule:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedules();
    }, [classId]);

    const handleAdd = async () => {
        if (!startTime) {
            setError("Start time is required.");
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
                      "Failed to add schedule slot."
            );
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteScheduleSlot(deleteTargetId);
            setDeleteTargetId(null);
            loadSchedules();
            onUpdate?.();
        } catch (err) {
            console.error("Error deleting schedule slot:", err);
            setDeleteTargetId(null);
        }
    };

    return (
        <div className="card-body mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="heading-3">Weekly Schedule</h3>
                <button
                    className="btn-secondary"
                    onClick={() => {
                        setShowAddModal(true);
                        setError(null);
                    }}
                >
                    + Add Slot
                </button>
            </div>

            {loading ? (
                <p className="text-sm text-blue">Loading schedule...</p>
            ) : schedules.length === 0 ? (
                <p className="text-sm text-blue">
                    No schedule slots yet. Add one to set the weekly timetable.
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {schedules.map((slot) => (
                        <div
                            key={slot.id}
                            className="badge-tag flex items-center gap-2"
                        >
                            <span>
                                {DAY_SHORT[slot.day_of_week]} {slot.start_time?.slice(0, 5)}
                                {slot.end_time ? ` - ${slot.end_time.slice(0, 5)}` : ""}
                            </span>
                            <button
                                className="text-danger hover:text-danger/70"
                                onClick={() => setDeleteTargetId(slot.id)}
                                title="Remove slot"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Slot Modal */}
            {showAddModal && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">Add Schedule Slot</h3>
                        </div>
                        <div className="modal-body">
                            {!sessionDuration && (
                                <div className="alert-warning mb-4">
                                    <p className="alert-desc">
                                        This class has no session duration set.
                                        End time cannot be calculated until you
                                        add one (edit the class).
                                    </p>
                                </div>
                            )}

                            <div className="form-field mb-4">
                                <label className="form-label">Day of Week</label>
                                <select
                                    className="form-select"
                                    value={dayOfWeek}
                                    onChange={(e) => setDayOfWeek(e.target.value)}
                                >
                                    {DAYS.map((d) => (
                                        <option key={d.value} value={d.value}>
                                            {d.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-field">
                                <label className="form-label">
                                    Start Time <span className="form-required">*</span>
                                </label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>

                            {error && (
                                <p className="form-error mt-2">{error}</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-muted"
                                onClick={() => {
                                    setShowAddModal(false);
                                    setError(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleAdd}>
                                Add Slot
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTargetId && (
                <div className="modal-backdrop">
                    <div className="modal-sm">
                        <div className="modal-header">
                            <h3 className="modal-title">Remove Schedule Slot</h3>
                        </div>
                        <div className="modal-body">
                            <p className="text-body">
                                Are you sure you want to remove this schedule slot?
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-muted"
                                onClick={() => setDeleteTargetId(null)}
                            >
                                Cancel
                            </button>
                            <button className="btn-danger" onClick={handleDeleteConfirm}>
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ScheduleSection;