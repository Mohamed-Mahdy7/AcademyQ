import { useContext, useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { StudentContext } from "../../context/StudentsContext"
import { useTranslation } from "react-i18next"
import { toast } from "../../lib/toastBus"
import api from "../../api"

const EditStudentProfile = ({ onClose }) => {
    const {
        student,
        updateStudent,
        getStudent
    } = useContext(StudentContext);
    const { t } = useTranslation(["students, common"]);
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [parent_email, setParentEmail] = useState("");
    const [educational_level, setEducationalLevel] = useState("");
    const [educational_levels, setEducationalLevels] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();
    
    async function fetchEducationalLevels() {
            try{
                const response = await api.get("api/auth/educational_levels/");
                setEducationalLevels(response.data)
            } catch (error) {
                toast.warning(t("could_not_load_educational_levels"), t("refresh_page_message"));
            }
        }

    useEffect(() => {
        getStudent(id);
    }, [id]);
    
    useEffect(() => {
        fetchEducationalLevels();
    }, []);

    useEffect(() => {
        if (!student) return;

        setFullName(student.full_name || "");
        setEmail(student.email || "");
        setPhone(student.phone || "");
        setParentEmail(student.parent_email || "");
        setEducationalLevel(student.educational_level || "");
    }, [student]);

    if (!student) {
        return <div className="skeleton skeleton-card" />;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setFieldErrors({});

        const noChanges =
        full_name === (student.full_name || "") &&
        email === (student.email || "") &&
        phone === (student.phone || "") &&
        parent_email === (student.parent_email || "") &&
        educational_level === (student.educational_level || "");

        if (noChanges) {
            toast.warning(t("no_changes_made"), t("edit_before_saving"));
            return;
        }

        setSaving(true);
        const data = { educational_level, email, full_name, parent_email, phone };
        const result = await updateStudent(id, data);
        setSaving(false);

        if (result.success) {
            toast.success(t("student_profile_updated"), `${full_name} ${t("student_profile_saved")}`);
            onClose();
            navigate(`/student/${result.data.id}`);
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
                {t("students:student_profile")}
            </h1>
            <div className="divider"></div>
            <div className="flex flex-col gap-3">
                <div>
                    <label htmlFor="fullName" className="form-label">{t("students:full_name")}</label>
                    <input 
                        type="text" 
                        name="fullName" 
                        id="fullName"
                        placeholder={t("students:full_name_placeholder")}
                        value={full_name}
                        onChange={(e) => setFullName(e.target.value)}
                        className={fieldErrors.full_name ? "form-input-error" : "form-input"}
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
                        placeholder={t("students:email_placeholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={fieldErrors.email ? "form-input-error" : "form-input"}
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
                        placeholder={t("students:phone_placeholder")}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={fieldErrors.phone ? "form-input-error" : "form-input"}
                        required
                    />
                    {fieldErrors.phone && <p className="form-error">{fieldErrors.phone[0]}</p>}
                </div>
                <div>
                    <label htmlFor="parentEmail" className="form-label">{t("students:parent_email")}</label>
                    <input 
                        type="text" 
                        name="parentEmail" 
                        id="parentEmail"
                        placeholder={t("students:parent_email_placeholder")}
                        value={parent_email}
                        onChange={(e) => setParentEmail(e.target.value)}
                        className={fieldErrors.parent_email ? "form-input-error" : "form-input"}
                        required
                    />
                    {fieldErrors.parent_email && <p className="form-error">{fieldErrors.parent_email[0]}</p>}
                </div>
                <div>
                    <label htmlFor="educational_level">{t("students:educational_level")}</label>
                    <select 
                        name="educational_level" 
                        id="educational_level"
                        value={educational_level}
                        onChange={(e) => setEducationalLevel(Number(e.target.value))}
                        required
                        className={fieldErrors.educational_level ? "form-input-error" : "form-select"}
                    >
                        <option value="">Select an educational level</option>
                        {educational_levels.map((level) => (
                            <option
                                key={level.value}
                                value={level.value}
                            >
                                {level.label}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.educational_level && <p className="form-error">{fieldErrors.educational_level[0]}</p>}
                </div>
            </div>
            <button type="submit" className="btn-primary mt-4 w-full" disabled={saving}>
                {saving ? <span className="btn-spinner" /> : t("save_changes")}
                </button>
        </form>
    )
}

export default EditStudentProfile