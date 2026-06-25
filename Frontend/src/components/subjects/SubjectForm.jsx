import { useState } from "react";
import { toast } from "../../lib/toastBus";

function SubjectForm({ onSubmit, initialData = {} }) {
    const [formData, setFormData] = useState({
        name: initialData.name || "",
        description: initialData.description || "",
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: null });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = "Subject name is required.";
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Subject name must be at least 2 characters.";
        } else if (formData.name.trim().length > 64) {
            newErrors.name = "Subject name cannot exceed 64 characters.";
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            toast.warning(
                "Please fix the highlighted fields.",
                "Some required fields are missing or invalid."
            );
            return;
        }

        setSubmitting(true);
        setErrors({});

        try {
            await onSubmit({
                name: formData.name.trim(),
                description: formData.description.trim(),
            });
        } catch (error) {
            const data = error.response?.data;

            if (data?.code === "validation_error" && data?.fields) {
                const fieldErrors = {};
                Object.entries(data.fields).forEach(([key, messages]) => {
                    fieldErrors[key] = Array.isArray(messages)
                        ? messages[0]
                        : messages;
                });
                setErrors(fieldErrors);
                toast.warning(
                    "Please fix the highlighted fields.",
                    "Some fields were rejected by the server."
                );
            } else if (data?.detail) {
                toast.danger("Something went wrong", data.detail);
            } else {
                toast.danger(
                    "Something went wrong",
                    "An unexpected error occurred. Please try again."
                );
            }
        } finally {
            setSubmitting(false);
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
                    className={
                        errors.description ? "form-input-error" : "form-textarea"
                    }
                />
                {errors.description && (
                    <span className="form-error">{errors.description}</span>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                >
                    {submitting ? "Saving..." : "Save Subject"}
                </button>
            </div>
        </form>
    );
}

export default SubjectForm;