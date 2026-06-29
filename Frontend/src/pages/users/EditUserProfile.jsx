import { useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { UsersContext } from "../../context/UsersContext"
import { toast } from "../../lib/toastBus"
import { useTranslation } from "react-i18next"


const EditUserProfile = ({ userId, onClose }) => {
    const { t } = useTranslation(["staff", "common"]);
    const { user, updateUser, getUser } = useContext(UsersContext);
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const roles = [
        { value: "A", label: t("common:admin") },
        { value: "T", label: t("common:teacher") },
    ];

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

        const unchanged =
            full_name === (user.full_name || "") &&
            email === (user.email || "") &&
            phone === (user.phone || "") &&
            role === (user.role || "");

        if (unchanged) {
            toast.warning(t("common:no_changes_made"), t("common:no_changes_made"));
            return;
        }

        setSaving(true);
        const result = await updateUser(userId, { full_name, email, phone, role });
        setSaving(false);

        if (result.success) {
            toast.success(t("user_updated"), t("user_updated_desc", { name: full_name }));
            onClose();
            navigate("/users/");
        } else if (result.error?.response?.data?.code === "validation_error") {
            setFieldErrors(result.error.response.data.fields || {});
        }
    }

    function fieldClass(name) {
        return fieldErrors[name] ? "form-input-error" : "form-input";
    }

    return (
        <form onSubmit={handleSubmit} className="form-card">
            <h1 className="text-3xl font-bold text-navy mb-8">
                {t("user_profile")}
            </h1>
            <div className="divider" />
            <div className="flex flex-col gap-3">
                <div>
                    <label htmlFor="fullName" className="form-label">{t("common:full_name")}</label>
                    <input
                        type="text"
                        name="fullName"
                        id="fullName"
                        placeholder={t("common:full_name_placeholder")}
                        value={full_name}
                        onChange={(e) => setFullName(e.target.value)}
                        className={fieldClass("full_name")}
                        required
                    />
                    {fieldErrors.full_name && <p className="form-error">{fieldErrors.full_name[0]}</p>}
                </div>
                <div>
                    <label htmlFor="email" className="form-label">{t("common:email")}</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        placeholder={t("common:email_placeholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={fieldClass("email")}
                        required
                    />
                    {fieldErrors.email && <p className="form-error">{fieldErrors.email[0]}</p>}
                </div>
                <div>
                    <label htmlFor="phone" className="form-label">{t("common:phone")}</label>
                    <input
                        type="text"
                        name="phone"
                        id="phone"
                        placeholder={t("common:phone_placeholder")}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={fieldClass("phone")}
                        required
                    />
                    {fieldErrors.phone && <p className="form-error">{fieldErrors.phone[0]}</p>}
                </div>
                <div>
                    <label htmlFor="role" className="form-label">{t("role")}</label>
                    <select
                        name="role"
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        className="form-select"
                    >
                        <option value="">{t("select_a_role")}</option>
                        {roles.map((roleOption) => (
                            <option key={roleOption.value} value={roleOption.value}>
                                {roleOption.label}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.role && <p className="form-error">{fieldErrors.role[0]}</p>}
                </div>
            </div>
            <button type="submit" className="btn-primary mt-4 w-full" disabled={saving}>
                {saving ? <span className="btn-spinner" /> : t("common:save_changes")}
            </button>
        </form>
    );
};

export default EditUserProfile;