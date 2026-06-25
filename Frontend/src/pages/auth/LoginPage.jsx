import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "../../lib/toastBus";


function Login() {
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
            toast.success("Welcome back!");
            navigate("/dashboard");
        } else {
            setError(
                result.error?.response?.data?.detail || "Incorrect email or password."
            );
        }
    };

    return (
        <main className="min-h-screen w-6/12 mx-auto flex flex-col items-center justify-center p-6">
            <form onSubmit={handleSubmit} className="w-full bg-card form-card p-8 space-y-5">
                <h1 className="text-3xl font font-bold text-navy">Login</h1>

                {error && (
                    <div className="alert-danger">
                        <div className="alert-desc">{error}</div>
                    </div>
                )}

                <div className="flex justify-between items-center space-y-2">
                    <label htmlFor="email" className="form-label m-0">Email</label>
                    <input
                        type="email" 
                        name="email" 
                        id="email" 
                        placeholder="Enter your email"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="form-input w-10/12" 
                        required
                    />
                </div>
                <div className="flex justify-between items-center space-y-2">
                    <label htmlFor="password" className="form-label m-0">Password</label>
                    <input
                        type="password" 
                        name="password" 
                        id="password" 
                        placeholder="Password"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className="form-input w-10/12" 
                        required
                    />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={submitting}>
                    {submitting ? <span className="btn-spinner" /> : "Login"}
                </button>
            </form>
            <div className="flex gap-3 mt-4 items-center justify-center-safe">
                <p className="subheading">Don't have an account? </p>
                <button className="btn-muted" onClick={() => navigate("/register")}>Register</button>
            </div>
        </main>
    )
}

export default Login