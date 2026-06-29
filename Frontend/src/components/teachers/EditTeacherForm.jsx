import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UsersContext } from "../../context/UsersContext";
import { toast } from "../../lib/toastBus";
import { useTranslation } from "react-i18next"

const EditTeacherForm = ({ userId, onClose }) => {
    const { t } = useTranslation("teacher");
    const {
        user,
        updateUser,
        getUser,
    } = useContext(UsersContext);

    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [role, setRole] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        getUser(userId);
    }, [userId]);

    useEffect(() => {
        if (!user) return;

        setFullName(user.full_name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setRole(user.role || "");
    }, [user]);

    if (!user) {
        return <div className="skeleton skeleton-card" />;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setFieldErrors({});

    const noChanges =
        full_name === (user.full_name || "") &&
        email === (user.email || "") &&
        phone === (user.phone || "") &&
        role === (user.role || "");

        if (noChanges) {
            toast.warning(t("toast.no_changes_title"), t("toast.no_changes_desc"));
            return;
        }

        setSaving(true);

        const result = await updateUser(userId, {
            full_name,
            email,
            phone,
            role: user.role,
        });

        setSaving(false);

        if (result.success) {
            toast.success(t("toast.updated_title"), t("toast.updated_desc", { name: full_name }));
            onClose();
            navigate("/teacher");
        } else if (result.error?.response?.data?.code === "validation_error") {
            setFieldErrors(result.error.response.data.fields || {});
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="form-card"
        >
            <h1 className="text-3xl font-bold text-navy mb-8">
                {t("edit_form.title")}
            </h1>

            <div className="divider"></div>

            <div className="flex flex-col gap-3">
                <div>
                    <label htmlFor="fullName" className="form-label">
                        {t("edit_form.full_name_label")}
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        placeholder={t("edit_form.full_name_placeholder")}
                        value={full_name}
                        onChange={(e) => setFullName(e.target.value)}
                        className="form-input"
                        required
                    />
                    {fieldErrors.full_name && (
                        <p className="form-error">
                            {fieldErrors.full_name[0]}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="email" className="form-label">
                        {t("edit_form.email_label")}
                    </label>
                    <input
                        type="email"
                        id="email"
                        placeholder={t("edit_form.email_placeholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                        required
                    />
                    {fieldErrors.email && (
                        <p className="form-error">
                            {fieldErrors.email[0]}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="phone" className="form-label">
                        {t("edit_form.phone_label")}
                    </label>
                    <input
                        type="text"
                        id="phone"
                        placeholder={t("edit_form.phone_placeholder")}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="form-input"
                        required
                    />
                    {fieldErrors.phone && (
                        <p className="form-error">
                            {fieldErrors.phone[0]}
                        </p>
                    )}
                </div>
            </div>

            <button
                type="submit"
                className="btn-primary mt-4 w-full"
                disabled={saving}
            >
                {saving ? <span className="btn-spinner" /> : t("edit_form.save_button")}
            </button>
        </form>
    );
};

export default EditTeacherForm;