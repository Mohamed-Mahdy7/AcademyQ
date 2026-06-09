import { useState, useEffect } from "react";
import { getSubjects } from "../../services/subjectService";
import { getTeachers } from "../../services/teachers";

function ClassForm({ onSubmit, initialData = {} }) {
    const [formData, setFormData] = useState({
        name: initialData.name || "",
        subject: initialData.subject || "",
        session_time: initialData.session_time || "",
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        is_active: initialData.is_active ?? true,
        teachers: initialData.teachers
            ? initialData.teachers.map((t) => t.id)
            : [],
    });
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [errors, setErrors] = useState({});
    const [loadingOptions, setLoadingOptions] = useState(true);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [subjectsRes, teachersRes] = await Promise.all([
                    getSubjects(),
                    getTeachers(),
                ]);
                setSubjects(subjectsRes.data.results);
                setTeachers(teachersRes.data.results);
            } catch (error) {
                console.error("Error loading form options:", error);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSubmit({ ...formData });
        } catch (error) {
            if (error.response?.data) {
                setErrors(error.response.data);
            }
        }
    };

    if (loadingOptions) return <p className="text-sm text-blue">Loading form...</p>;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* Class Name */}
            <div className="form-field">
                <label className="form-label">
                    Class Name <span className="form-required">*</span>
                </label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Math G7 Mon/Wed 4pm"
                    className={errors.name ? "form-input-error" : "form-input"}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Subject */}
            <div className="form-field">
                <label className="form-label">
                    Subject <span className="form-required">*</span>
                </label>
                <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={errors.subject ? "form-input-error" : "form-select"}
                >
                    <option value="">-- Select Subject --</option>
                    {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
                {errors.subject && <span className="form-error">{errors.subject}</span>}
            </div>

            {/* Session Time */}
            <div className="form-field">
                <label className="form-label">
                    Session Time <span className="form-required">*</span>
                </label>
                <input
                    type="time"
                    name="session_time"
                    value={formData.session_time}
                    onChange={handleChange}
                    required
                    className={errors.session_time ? "form-input-error" : "form-input"}
                />
                {errors.session_time && <span className="form-error">{errors.session_time}</span>}
            </div>

            {/* Start & End Date */}
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
                        required
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
                        required
                        className={errors.end_date ? "form-input-error" : "form-input"}
                    />
                    {errors.end_date && <span className="form-error">{errors.end_date}</span>}
                </div>
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="form-checkbox"
                />
                <label htmlFor="is_active" className="form-label mb-0">
                    Active
                </label>
            </div>

            {/* Teachers */}
            <div className="form-field">
                <label className="form-label">Teachers (optional)</label>
                <div className="space-y-2 mt-1">
                    {teachers.length === 0 ? (
                        <p className="text-sm text-blue">No teachers available.</p>
                    ) : (
                        teachers.map((t) => (
                            <label
                                key={t.id}
                                className="flex items-center gap-2 cursor-pointer"
                            >
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

            {errors.non_field_errors && (
                <div className="alert-danger">
                    <p className="alert-desc">{errors.non_field_errors}</p>
                </div>
            )}

            <div className="flex justify-end">
                <button type="submit" className="btn-primary">
                    Save Class
                </button>
            </div>

        </form>
    );
}

export default ClassForm;