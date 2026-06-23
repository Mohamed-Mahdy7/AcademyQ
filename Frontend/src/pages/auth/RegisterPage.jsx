import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";


function Register() {
    const { register } = useContext(AuthContext)
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
            setFieldErrors({ confirm_password: ["Passwords do not match"] });
            return;
        }

        setSubmitting(true);
        const result = await register({
            academy_name, academy_email, academy_phone, address,
            full_name, email, phone, password, confirm_password,
        });
        setSubmitting(false);

        if (result.success) {
            navigate("/");
        } else if (result.error?.response?.data?.code === "validation_error") {
            setFieldErrors(result.error.response.data.fields || {});
        }
    }

    function fieldClass(name) {
        return fieldErrors[name] ? "form-input-error" : "form-input w-9/12";
    }

    return (
        <div className="w-6/12 mx-auto py-10 align-middle">
            <form onSubmit={handleSubmit} className="form-card">
                <h1 className="text-3xl font-bold text-navy mb-8">Academy Registration</h1>
                <div>
                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="academyName" className="form-label m-0">Academy Name</label>
                        <input type="text" id="academyName" value={academy_name}
                            onChange={(e) => setAcademyName(e.target.value)}
                            className={fieldClass("academy_name")} required />
                    </div>
                    {fieldErrors.academy_name && <p className="form-error">{fieldErrors.academy_name[0]}</p>}

                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="academyEmail" className="form-label m-0">Academy Email</label>
                        <input type="email" id="academyEmail" value={academy_email}
                            onChange={(e) => setAcademyEmail(e.target.value)}
                            className={fieldClass("academy_email")} required />
                    </div>
                    {fieldErrors.academy_email && <p className="form-error">{fieldErrors.academy_email[0]}</p>}

                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="academyPhone" className="form-label m-0">Academy Phone</label>
                        <input type="text" id="academyPhone" value={academy_phone}
                            onChange={(e) => setAcademyPhone(e.target.value)}
                            className={fieldClass("academy_phone")} required />
                    </div>
                    {fieldErrors.academy_phone && <p className="form-error">{fieldErrors.academy_phone[0]}</p>}

                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="address" className="form-label m-0">Address</label>
                        <input type="text" id="address" value={address}
                            onChange={(e) => setAcademyAddress(e.target.value)}
                            className={fieldClass("address")} required />
                    </div>
                    {fieldErrors.address && <p className="form-error">{fieldErrors.address[0]}</p>}

                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="fullName" className="form-label m-0">Owner Name</label>
                        <input type="text" id="fullName" value={full_name}
                            onChange={(e) => setFullName(e.target.value)}
                            className={fieldClass("full_name")} required />
                    </div>
                    {fieldErrors.full_name && <p className="form-error">{fieldErrors.full_name[0]}</p>}

                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="email" className="form-label m-0">Owner Email</label>
                        <input type="email" id="email" value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={fieldClass("email")} required />
                    </div>
                    {fieldErrors.email && <p className="form-error">{fieldErrors.email[0]}</p>}

                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="phone" className="form-label m-0">Owner Phone</label>
                        <input type="text" id="phone" value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={fieldClass("phone")} required />
                    </div>
                    {fieldErrors.phone && <p className="form-error">{fieldErrors.phone[0]}</p>}

                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="password" className="form-label m-0">Password</label>
                        <input type="password" id="password" value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={fieldClass("password")} required />
                    </div>
                    {fieldErrors.password && <p className="form-error">{fieldErrors.password[0]}</p>}

                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="confirmPassword" className="form-label m-0">Confirm Password</label>
                        <input type="password" id="confirmPassword" value={confirm_password}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={fieldClass("confirm_password")} required />
                    </div>
                    {fieldErrors.confirm_password && <p className="form-error">{fieldErrors.confirm_password[0]}</p>}
                </div>
                <button type="submit" className="btn-primary mt-4 w-full" disabled={submitting}>
                    {submitting ? <span className="btn-spinner" /> : "Register"}
                </button>
            </form>
            <div className="flex gap-3 mt-4 items-center justify-center-safe">
                <p className="subheading">Already have an account? </p>
                <button className="btn-muted" onClick={() => navigate("/login")}>Login</button>
            </div>
        </div>
    )

}

export default Register;