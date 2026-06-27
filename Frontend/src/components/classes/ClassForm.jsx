import { useState, useEffect } from "react";
import { getSubjects } from "../../services/subjectService";
import { getTeachers } from "../../services/teachers";
import { toast } from "../../lib/toastBus";

function ClassForm({ onSubmit, initialData = {}, isEditing = false }) {
    const [formData, setFormData] = useState({
        name: initialData.name || "",
        subject: initialData.subject || "",
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        is_active: initialData.is_active ?? true,
        session_count: initialData.session_count || "",
        session_price: initialData.session_price || "",
        session_duration: initialData.session_duration || "",
        teachers: initialData.teachers
            ? initialData.teachers.map((t) => t.teacher_id)
            : [],
    });
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [subjectsRes, teachersRes] = await Promise.all([
                    getSubjects(),
                    getTeachers(),
                ]);
                setSubjects(subjectsRes.data);
                setTeachers(teachersRes.data);
            } catch {
                toast.danger("Failed to load form", "Could not load subjects or teachers.");
            } finally {
                setLoadingOptions(false);
            }
        };
        fetchOptions();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setErrors((prev) => ({ ...prev, [name]: null }));
    };

    const handleTeacherToggle = (teacherId) => {
        setFormData((prev) => {
            const already = prev.teachers.includes(teacherId);
            return {
                ...prev,
                teachers: already
                    ? prev.teachers.filter((id) => id !== teacherId)
                    : [...prev.teachers, teacherId],
            };
        });
    };

    const validate = () => {
        const errs = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!formData.name.trim())
            errs.name = "Class name is required.";

        if (!formData.subject)
            errs.subject = "Please select a subject.";

        if (!formData.start_date) {
            errs.start_date = "Start date is required.";
        } else if (!isEditing && new Date(formData.start_date) < today) {
            errs.start_date = "Start date cannot be in the past.";
        }

        if (!formData.end_date) {
            errs.end_date = "End date is required.";
        } else if (formData.start_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
            errs.end_date = "End date must be after start date.";
        }

        if (formData.session_count !== "" && Number(formData.session_count) < 1)
            errs.session_count = "Session count must be at least 1.";

        if (formData.session_price !== "" && Number(formData.session_price) < 0)
            errs.session_price = "Session price cannot be negative.";

        if (formData.session_duration) {
            const durationRegex = /^\d{2}:\d{2}:\d{2}$/;
            if (!durationRegex.test(formData.session_duration))
                errs.session_duration = "Duration must be in HH:MM:SS format.";
        }

        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);
        setErrors({});

        const payload = { ...formData };
        if (payload.session_count === "") delete payload.session_count;
        if (payload.session_price === "") delete payload.session_price;
        if (payload.session_duration === "") delete payload.session_duration;

        try {
            await onSubmit(payload);
        } catch (error) {
            const data = error.response?.data;

            const fieldKeys = [
                "name", "subject", "start_date", "end_date",
                "session_count", "session_price", "session_duration", "teachers",
            ];
            const fieldErrors = {};
            fieldKeys.forEach((key) => {
                if (data?.[key]) {
                    fieldErrors[key] = Array.isArray(data[key])
                        ? data[key][0]
                        : data[key];
                }
            });

            if (Object.keys(fieldErrors).length > 0) {
                setErrors(fieldErrors);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingOptions)
        return <p className="text-sm text-blue">Loading form...</p>;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            <div className="form-field">
                <label className="form-label">
                    Class Name <span className="form-required">*</span>
                </label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Math G7 Mon/Wed"
                    className={errors.name ? "form-input-error" : "form-input"}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-field">
                <label className="form-label">
                    Subject <span className="form-required">*</span>
                </label>
                <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={errors.subject ? "form-input-error" : "form-select"}
                >
                    <option value="">-- Select Subject --</option>
                    {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                {errors.subject && <span className="form-error">{errors.subject}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="form-field">
                    <label className="form-label">
                        Start Date <span className="form-required">*</span>
                    </label>
                    <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className={errors.start_date ? "form-input-error" : "form-input"}
                    />
                    {errors.start_date && <span className="form-error">{errors.start_date}</span>}
                </div>
                <div className="form-field">
                    <label className="form-label">
                        End Date <span className="form-required">*</span>
                    </label>
                    <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        className={errors.end_date ? "form-input-error" : "form-input"}
                    />
                    {errors.end_date && <span className="form-error">{errors.end_date}</span>}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="form-field">
                    <label className="form-label">Session Count</label>
                    <input
                        type="number"
                        name="session_count"
                        value={formData.session_count}
                        onChange={handleChange}
                        placeholder="e.g. 40"
                        className={errors.session_count ? "form-input-error" : "form-input"}
                    />
                    {errors.session_count && <span className="form-error">{errors.session_count}</span>}
                </div>
                <div className="form-field">
                    <label className="form-label">Session Price (EGP)</label>
                    <input
                        type="number"
                        name="session_price"
                        value={formData.session_price}
                        onChange={handleChange}
                        placeholder="e.g. 150"
                        className={errors.session_price ? "form-input-error" : "form-input"}
                    />
                    {errors.session_price && <span className="form-error">{errors.session_price}</span>}
                </div>
                <div className="form-field">
                    <label className="form-label">Session Duration</label>
                    <input
                        type="text"
                        name="session_duration"
                        value={formData.session_duration}
                        onChange={handleChange}
                        placeholder="e.g. 01:30:00"
                        className={errors.session_duration ? "form-input-error" : "form-input"}
                    />
                    <span className="form-hint">Format: HH:MM:SS</span>
                    {errors.session_duration && <span className="form-error">{errors.session_duration}</span>}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="form-checkbox"
                />
                <label htmlFor="is_active" className="form-label mb-0">Active</label>
            </div>

            <div className="form-field">
                <label className="form-label">Teachers (optional)</label>
                <div className="space-y-2 mt-1">
                    {teachers.length === 0 ? (
                        <p className="text-sm text-blue">No teachers available.</p>
                    ) : (
                        teachers.map((t) => (
                            <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.teachers.includes(t.id)}
                                    onChange={() => handleTeacherToggle(t.id)}
                                    className="form-checkbox"
                                />
                                <span className="text-sm text-navy">{t.name}</span>
                            </label>
                        ))
                    )}
                </div>
                {errors.teachers && <span className="form-error">{errors.teachers}</span>}
            </div>

            <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Saving..." : "Save Class"}
                </button>
            </div>

        </form>
    );
}

export default ClassForm;