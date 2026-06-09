import { useState } from "react";

function SubjectForm({ onSubmit, initialData = {} }) {
    const [formData, setFormData] = useState({
        name: initialData.name || "",
        description: initialData.description || "",
        session_count: initialData.session_count || "",
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSubmit({
                name: formData.name,
                description: formData.description,
                session_count: Number(formData.session_count),
            });
        } catch (error) {
            if (error.response?.data) {
                setErrors(error.response.data);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            <div className="form-field">
                <label className="form-label">
                    Name <span className="form-required">*</span>
                </label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Mathematics"
                    className={errors.name ? "form-input-error" : "form-input"}
                />
                {errors.name && (
                    <span className="form-error">{errors.name}</span>
                )}
            </div>

            <div className="form-field">
                <label className="form-label">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief description of the subject..."
                    className={errors.description ? "form-input-error" : "form-textarea"}
                />
                {errors.description && (
                    <span className="form-error">{errors.description}</span>
                )}
            </div>

            <div className="form-field">
                <label className="form-label">
                    Session Count <span className="form-required">*</span>
                </label>
                <input
                    type="number"
                    name="session_count"
                    value={formData.session_count}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="e.g. 24"
                    className={errors.session_count ? "form-input-error" : "form-input"}
                />
                {errors.session_count && (
                    <span className="form-error">{errors.session_count}</span>
                )}
            </div>

            {errors.non_field_errors && (
                <div className="alert-danger">
                    <p className="alert-desc">{errors.non_field_errors}</p>
                </div>
            )}

            <div className="flex justify-end">
                <button type="submit" className="btn-primary">
                    Save Subject
                </button>
            </div>

        </form>
    );
}

export default SubjectForm;