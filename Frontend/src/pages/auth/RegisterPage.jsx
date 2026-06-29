import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "../../lib/toastBus";
import { useTranslation } from "react-i18next";


function Register() {
    const { register } = useContext(AuthContext)
    const { t } = useTranslation(["auth", "common"])
    const [academy_name, setAcademyName] = useState("");
    const [academy_email, setAcademyEmail] = useState("");
    const [academy_phone, setAcademyPhone] = useState("");
    const [address, setAcademyAddress] = useState("")
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setFieldErrors({});

        if (password !== confirm_password) {
            setFieldErrors({ confirm_password: [t("passwords_do_not_match")] });
            return;
        }

        setSubmitting(true);
        const result = await register({
            academy_name, academy_email, academy_phone, address,
            full_name, email, phone, password, confirm_password,
        });
        setSubmitting(false);

        if (result.success) {
            toast.success(t("academy_registered"), t("welcome_to_academiq"));
            navigate("/dashboard");
        } else if (result.error?.response?.data?.code === "validation_error") {
            setFieldErrors(result.error.response.data.fields || {});
        } else {
            toast.danger(t("common:registration_failed"), t("common:check_details_try_again"));
        }
    }

    function fieldClass(name) {
        return fieldErrors[name] ? "form-input-error" : "form-input w-9/12";
    }

    return (
        <div className="w-6/12 mx-auto py-10 align-middle">
            <form onSubmit={handleSubmit} className="form-card">
                <h1 className="text-3xl font-bold text-navy mb-8">{t("auth:academy_registration")}</h1>
                <div>
                    <div className="form-field my-2">
                        <label htmlFor="academyName" className="form-label m-0">{t("academy_name")}</label>
                        <input 
                            type="text" 
                            id="academyName" 
                            value={academy_name}
                            placeholder={t("academy_name_placeholder")}
                            onChange={(e) => setAcademyName(e.target.value)}
                            className={fieldClass("academy_name"), "form-input placeholder:text-gray-400 bg-gray-100"} 
                            required 
                        />
                    </div>
                    {fieldErrors.academy_name && <p className="form-error">{fieldErrors.academy_name[0]}</p>}

                    <div className="form-field my-2">
                        <label htmlFor="academyEmail" className="form-label m-0">{t("academy_email")}</label>
                        <input 
                            type="email" 
                            id="academyEmail" 
                            value={academy_email}
                            placeholder={t("academy_email_placeholder")}
                            onChange={(e) => setAcademyEmail(e.target.value)}
                            className={fieldClass("academy_email"), "form-input placeholder:text-gray-400 bg-gray-100"} 
                            required 
                        />
                    </div>
                    {fieldErrors.academy_email && <p className="form-error">{fieldErrors.academy_email[0]}</p>}

                    <div className="form-field my-2">
                        <label htmlFor="academyPhone" className="form-label m-0">{t("academy_phone")}</label>
                        <input 
                            type="text" 
                            id="academyPhone" 
                            value={academy_phone}
                            placeholder={t("academy_phone_placeholder")}
                            onChange={(e) => setAcademyPhone(e.target.value)}
                            className={fieldClass("academy_phone"), "form-input placeholder:text-gray-400 bg-gray-100"} 
                            required 
                        />
                    </div>
                    {fieldErrors.academy_phone && <p className="form-error">{fieldErrors.academy_phone[0]}</p>}

                    <div className="form-field my-2">
                        <label htmlFor="address" className="form-label m-0">{t("common:address")}</label>
                        <input 
                            type="text" 
                            id="address" 
                            value={address}
                            placeholder={t("academy_address_placeholder")}
                            onChange={(e) => setAcademyAddress(e.target.value)}
                            className={fieldClass("address"), "form-input placeholder:text-gray-400 bg-gray-100"} 
                            required 
                        />
                    </div>
                    {fieldErrors.address && <p className="form-error">{fieldErrors.address[0]}</p>}

                    <div className="form-field my-2">
                        <label htmlFor="fullName" className="form-label m-0">{t("owner_name")}</label>
                        <input 
                            type="text" 
                            id="fullName" 
                            value={full_name}
                            placeholder={t("owner_name_placeholder")}
                            onChange={(e) => setFullName(e.target.value)}
                            className={fieldClass("full_name"), "form-input placeholder:text-gray-400 bg-gray-100"} 
                            required 
                        />
                    </div>
                    {fieldErrors.full_name && <p className="form-error">{fieldErrors.full_name[0]}</p>}

                    <div className="form-field my-2">
                        <label htmlFor="email" className="form-label m-0">{t("owner_email")}</label>
                        <input 
                            type="email" 
                            id="email" 
                            value={email}
                            placeholder={t("owner_email_placeholder")}
                            onChange={(e) => setEmail(e.target.value)}
                            className={fieldClass("email"), "form-input placeholder:text-gray-400 bg-gray-100"} 
                            required 
                        />
                    </div>
                    {fieldErrors.email && <p className="form-error">{fieldErrors.email[0]}</p>}

                    <div className="form-field my-2">
                        <label htmlFor="phone" className="form-label m-0">{t("owner_phone")}</label>
                        <input 
                            type="text" 
                            id="phone" 
                            value={phone}
                            placeholder={t("owner_phone_placeholder")}
                            onChange={(e) => setPhone(e.target.value)}
                            className={fieldClass("phone"), "form-input placeholder:text-gray-400 bg-gray-100"} 
                            required 
                            />
                    </div>
                    {fieldErrors.phone && <p className="form-error">{fieldErrors.phone[0]}</p>}

                    <div className="form-field my-2">
                        <label htmlFor="password" className="form-label m-0">{t("common:password")}</label>
                        <input 
                            type="password" 
                            id="password" 
                            value={password}
                            placeholder={t("password_placeholder")}
                            onChange={(e) => setPassword(e.target.value)}
                            className={fieldClass("password"), "form-input placeholder:text-gray-400 bg-gray-100"} 
                            required 
                        />
                    </div>
                    {fieldErrors.password && <p className="form-error">{fieldErrors.password[0]}</p>}

                    <div className="form-field my-2">
                        <label htmlFor="confirmPassword" className="form-label m-0">{t("common:confirm_password")}</label>
                        <input 
                            type="password" 
                            id="confirmPassword" 
                            value={confirm_password}
                            placeholder={t("confirm_password_placeholder")}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={fieldClass("confirm_password"), "form-input placeholder:text-gray-400 bg-gray-100"} 
                            required 
                            />
                    </div>
                    {fieldErrors.confirm_password && <p className="form-error">{fieldErrors.confirm_password[0]}</p>}
                </div>
                <button type="submit" className="btn-primary mt-4 w-full" disabled={submitting}>
                    {submitting ? <span className="btn-spinner" /> : t("register")}
                </button>
            </form>
            <div className="flex gap-3 mt-4 items-center justify-center-safe">
                <p className="subheading">{t("already_have_account")}</p>
                <button className="btn-muted" onClick={() => navigate("/login")}>{t("common:login")}</button>
            </div>
        </div>
    )

}

export default Register;