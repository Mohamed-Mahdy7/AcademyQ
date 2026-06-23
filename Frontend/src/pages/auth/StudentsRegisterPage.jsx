import { useContext, useEffect, useState } from "react";
import { StudentContext } from "../../context/StudentsContext";
import api from "../../api";

function StudentRegister({ onClose }) {
    const {createStudent} = useContext(StudentContext)
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [parent_email, setParentEmail] = useState("");
    const [educational_level, setEducationalLevel] = useState("");
    const [academy, setAcademy] = useState("");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");
    const [educational_levels, setEducationalLevels] = useState([]);
    const [academies, setAcademies] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    async function fetchEducationalLevels() {
        try{
            const response = await api.get("api/auth/educational_levels/");
            setEducationalLevels(response.data)
        } catch (error) {
            console.error(error)
        }
    }

    async function fetchAcademies() {
        try {
            const response = await api.get("api/auth/academies/");
            setAcademies(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        fetchEducationalLevels();
        fetchAcademies();
    }, []);


    async function handleSubmit(e) {
        e.preventDefault();
        setFieldErrors({});

        if (password !== confirm_password) {
            setFieldErrors({ confirm_password: ["Passwords do not match"] });
            return;
        }

        setSubmitting(true);
        const result = await createStudent({
            full_name, email, phone, parent_email, academy, password, confirm_password,
            educational_level: Number(educational_level),
        });
        setSubmitting(false);

        if (result.success) {
            onClose();
        } else if (result.error?.response?.data?.code === "validation_error") {
            setFieldErrors(result.error.response.data.fields || {});
        }
    }

    function fieldClass(name) {
        return fieldErrors[name] ? "form-input-error" : "form-input";
    }

    return (
        <form 
            onSubmit={handleSubmit}
            className="form-card"
        >
            <h1 className="text-3xl font-bold text-navy mb-8">Student Registration</h1>
            <div className="grid md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="fullName" className="form-label">Full Name</label>
                    <input type="text" id="fullName" value={full_name}
                        onChange={(e) => setFullName(e.target.value)}
                        className={fieldClass("full_name")} required />
                    {fieldErrors.full_name && <p className="form-error">{fieldErrors.full_name[0]}</p>}
                </div>
                <div>
                    <label htmlFor="email" className="form-label">Email</label>
                    <input type="email" id="email" value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={fieldClass("email")} required />
                    {fieldErrors.email && <p className="form-error">{fieldErrors.email[0]}</p>}
                </div>
                <div>
                    <label htmlFor="phone" className="form-label">Phone</label>
                    <input type="text" id="phone" value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={fieldClass("phone")} required />
                    {fieldErrors.phone && <p className="form-error">{fieldErrors.phone[0]}</p>}
                </div>
                <div>
                    <label htmlFor="parentEmail" className="form-label">Parent email</label>
                    <input type="email" id="parentEmail" value={parent_email}
                        onChange={(e) => setParentEmail(e.target.value)}
                        className={fieldClass("parent_email")} required />
                    {fieldErrors.parent_email && <p className="form-error">{fieldErrors.parent_email[0]}</p>}
                </div>
                <div>
                    <label htmlFor="academy" className="form-label">Academy</label>
                    <select id="academy" value={academy} onChange={(e) => setAcademy(e.target.value)}
                        className={fieldErrors.academy ? "form-input-error" : "form-select"}>
                        <option value="">Select an academy</option>
                        {academies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    {fieldErrors.academy && <p className="form-error">{fieldErrors.academy[0]}</p>}
                </div>
                <div>
                    <label htmlFor="educational_level" className="form-label">Educational Level</label>
                    <select id="educational_level" value={educational_level}
                        onChange={(e) => setEducationalLevel(Number(e.target.value))} required
                        className={fieldErrors.educational_level ? "form-input-error" : "form-select"}>
                        <option value="">Select an educational level</option>
                        {educational_levels.map((level) => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                    </select>
                    {fieldErrors.educational_level && <p className="form-error">{fieldErrors.educational_level[0]}</p>}
                </div>
                <div>
                    <label htmlFor="password" className="form-label">Password</label>
                    <input type="password" id="password" value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={fieldClass("password")} required />
                    {fieldErrors.password && <p className="form-error">{fieldErrors.password[0]}</p>}
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input type="password" id="confirmPassword" value={confirm_password}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={fieldClass("confirm_password")} required />
                    {fieldErrors.confirm_password && <p className="form-error">{fieldErrors.confirm_password[0]}</p>}
                </div>
            </div>
            <button type="submit" className="btn-primary mt-4 w-full" disabled={submitting}>
                {submitting ? <span className="btn-spinner" /> : "Register"}
            </button>
        </form>
    )

}

export default StudentRegister;