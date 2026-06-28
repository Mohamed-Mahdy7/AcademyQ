import { useState } from "react";
import { useTranslation } from "react-i18next";

function SubjectForm({ onSubmit, initialData = {} }) {
    const { t } = useTranslation(["subjects", "common"]);
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
            errs.name = t("subject_name_required");
        } else if (name.length < 2) {
            errs.name = t("subject_name_min");
        } else if (name.length > 64) {
            errs.name = t("subject_name_max");
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
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-field">
                <label className="form-label">
                    {t("subject_name_label")} <span className="form-required">*</span>
                </label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("subject_name_placeholder")}
                    className={errors.name ? "form-input-error" : "form-input"}
                />
                {errors.name && (
                    <span className="form-error">{errors.name}</span>
                )}
            </div>

            <div className="form-field">
                <label className="form-label">{t("description")}</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder={t("subject_desc_placeholder")}
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
                    {submitting ? t("saving") : t("save_subject")}
                </button>
            </div>
        </form>
    );
}

export default SubjectForm;