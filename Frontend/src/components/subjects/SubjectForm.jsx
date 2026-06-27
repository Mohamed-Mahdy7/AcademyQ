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
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const errs = {};
        const name = formData.name.trim();
        if (!name) {
            errs.name = "Subject name is required.";
        } else if (name.length < 2) {
            errs.name = "Subject name must be at least 2 characters.";
        } else if (name.length > 64) {
            errs.name = "Subject name cannot exceed 64 characters.";
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

        try {
            await onSubmit({
                name: formData.name.trim(),
                description: formData.description.trim(),
            });
        } catch (error) {
            const data = error.response?.data;

            const fieldKeys = ["name", "description"];
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
            } else {
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
                    className={errors.description ? "form-input-error" : "form-textarea"}
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