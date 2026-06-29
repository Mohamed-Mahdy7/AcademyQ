import { useContext, useState } from "react";
import { UsersContext } from "../../context/UsersContext";
import { toast } from "../../lib/toastBus";
import { useTranslation } from "react-i18next";

function UserRegister({ onClose }) {
    const { t } = useTranslation(["staff", "common"]);
    const { createUser } = useContext(UsersContext);
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");
    const [role, setRole] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const roles = [
        { value: "A", label: t("common:admin") },
        { value: "T", label: t("common:teacher") },
    ];

    async function handleSubmit(e) {
        e.preventDefault();
        setFieldErrors({});

        if (password !== confirm_password) {
            setFieldErrors({ confirm_password: [t("common:passwords_do_not_match")] });
            return;
        }

        setSubmitting(true);
        const result = await createUser({
            full_name, email, phone, password, confirm_password, role,
        });
        setSubmitting(false);

        if (result.success) {
            const desc = role === "A"
                ? t("user_registered_desc_admin", { name: full_name })
                : t("user_registered_desc_teacher", { name: full_name });
            toast.success(t("user_registered"), desc);
            onClose();
        } else if (result.error?.response?.data?.code === "validation_error") {
            setFieldErrors(result.error.response.data.fields || {});
        }
    }

    function fieldClass(name) {
        return fieldErrors[name] ? "form-input-error" : "form-input";
    }

    return (
        <form onSubmit={handleSubmit} className="form-card">
            <h1 className="text-3xl font-bold text-navy mb-8">{t("user_registration")}</h1>
            <div className="grid md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="fullName" className="form-label">{t("common:full_name")}</label>
                    <input
                        type="text"
                        id="fullName"
                        value={full_name}
                        placeholder={t("common:full_name_placeholder")}
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
                        id="email"
                        value={email}
                        placeholder={t("common:email_placeholder")}
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
                        id="phone"
                        value={phone}
                        placeholder={t("common:phone_placeholder")}
                        onChange={(e) => setPhone(e.target.value)}
                        className={fieldClass("phone")}
                        required
                    />
                    {fieldErrors.phone && <p className="form-error">{fieldErrors.phone[0]}</p>}
                </div>
                <div>
                    <label htmlFor="password" className="form-label">{t("common:password")}</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        placeholder={t("common:password_placeholder")}
                        onChange={(e) => setPassword(e.target.value)}
                        className={fieldClass("password")}
                        required
                    />
                    {fieldErrors.password && <p className="form-error">{fieldErrors.password[0]}</p>}
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="form-label">{t("common:confirm_password")}</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirm_password}
                        placeholder={t("common:confirm_password_placeholder")}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={fieldClass("confirm_password")}
                        required
                    />
                    {fieldErrors.confirm_password && <p className="form-error">{fieldErrors.confirm_password[0]}</p>}
                </div>
                <div>
                    <label htmlFor="role" className="form-label">{t("role")}</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        className={fieldErrors.role ? "form-input-error" : "form-select"}
                    >
                        <option value="">{t("select_a_role")}</option>
                        {roles.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                    {fieldErrors.role && <p className="form-error">{fieldErrors.role[0]}</p>}
                </div>
            </div>
            <button type="submit" className="btn-primary mt-4 w-full" disabled={submitting}>
                {submitting ? <span className="btn-spinner" /> : t("register")}
            </button>
        </form>
    );
}

export default UserRegister;