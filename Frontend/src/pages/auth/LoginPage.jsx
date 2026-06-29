import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { toast } from "../../lib/toastBus";


function Login() {
    const { t } = useTranslation("auth");
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        const result = await login(email, password);

        setSubmitting(false);

        if (result.success) {
            toast.success(t("welcome_back"));
            navigate("/dashboard");
        } else {
            setError(
                result.error?.response?.data?.detail || t("incorrect_credentials")
            );
        }
    };

    return (
        <main className="min-h-screen w-6/12 mx-auto flex flex-col items-center justify-center p-6">
            <form onSubmit={handleSubmit} className="w-full bg-card form-card p-8 space-y-5">
                <h1 className="text-3xl font font-bold text-navy">{t("login_title")}</h1>

                {error && (
                    <div className="alert-danger">
                        <div className="alert-desc">{error}</div>
                    </div>
                )}

                <div className="form-feild space-y-2">
                    <label htmlFor="email" className="form-label m-0">{t("email")}</label>
                    <input
                        type="email" 
                        name="email" 
                        id="email" 
                        placeholder={t("email_placeholder")}
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="form-input placeholder:text-gray-500" 
                        required
                    />
                </div>
                <div className="form-feild space-y-2">
                    <label htmlFor="password" className="form-label m-0">{t("password")}</label>
                    <input
                        type="password" 
                        name="password" 
                        id="password" 
                        placeholder={t("password_placeholder")}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className="form-input placeholder:text-gray-500" 
                        required
                    />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={submitting}>
                    {submitting ? <span className="btn-spinner" /> : t("login_title")}
                </button>
            </form>
            <div className="flex gap-3 mt-4 items-center justify-center-safe">
                <p className="subheading">{t(`no_account`)}</p>
                <button className="btn-muted" onClick={() => navigate("/register")}>{t("register")}</button>
            </div>
        </main>
    )
}

export default Login