import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserCheck, ChevronDown } from "lucide-react";
import { createStudentRequest } from "../../services/studentService";
import { toast } from "../../lib/toastBus";
import api from "../../api";


export default function StudentRegisterForm() {
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
        toast.warning("Couldn't load educational levels", "Try refreshing the page.");
    }
  }

  async function fetchAcademies() {
    try {
        const response = await api.get("api/auth/academies/");
        setAcademies(response.data);
    } catch (error) {
        toast.warning("Couldn't load academies data", "Try refreshing the page.");
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
    const result = await createStudentRequest({
        full_name, email, phone, parent_email, academy, password, confirm_password,
        educational_level: Number(educational_level),
    });
    setSubmitting(false);

    if (result.success) {
        toast.success("Student registered", `${full_name} has been added.`);
        onClose();
    } else if (result.error?.response?.data?.code === "validation_error") {
        setFieldErrors(result.error.response.data.fields || {});
    }
  }

  function fieldClass(name) {
    return fieldErrors[name] ? "form-input-error" : "form-input";
  }

  return (
    <div className="bg-white/5 border border-white/30 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 bg-blue/20 border border-blue/30 rounded-xl flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-blue" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Join your academy</h3>
          <p className="text-xs text-white/40">Your academy must already be registered on AcademiQ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="academy" className="form-label text-white">Academy</label>
          <select 
            id="academy" 
            value={academy} 
            onChange={(e) => setAcademy(e.target.value)}
            className={(fieldErrors.academy ? "form-input-error" : "form-select"), "bg-white/40 p-2 w-full rounded-lg"}
          >
            <option value="">Select an academy</option>
            {academies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
            {fieldErrors.academy && <p className="form-error">{fieldErrors.academy[0]}</p>}
        </div>
        <div>
          <label htmlFor="fullName" className="form-label text-white">Full Name</label>
          <input 
            type="text" 
            id="fullName" 
            value={full_name}
            placeholder="Full Name"
            onChange={(e) => setFullName(e.target.value)}
            className={fieldClass("full_name"), "bg-white/40 p-2 w-full rounded-lg"} 
            required 
          />
            {fieldErrors.full_name && <p className="form-error">{fieldErrors.full_name[0]}</p>}
        </div>
        <div>
          <label htmlFor="email" className="form-label text-white">Email</label>
          <input 
            type="email" 
            id="email" 
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass("email"), "bg-white/40 p-2 w-full rounded-lg"} 
            required 
          />
            {fieldErrors.email && <p className="form-error">{fieldErrors.email[0]}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="form-label text-white">Phone</label>
          <input 
            type="text" 
            id="phone" 
            value={phone}
            placeholder="Phone"
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass("phone"), "bg-white/40 p-2 w-full rounded-lg"} 
            required 
          />
            {fieldErrors.phone && <p className="form-error">{fieldErrors.phone[0]}</p>}
        </div>
        <div>
          <label htmlFor="parentEmail" className="form-label text-white">Parent email</label>
          <input 
            type="email" 
            id="parentEmail" 
            value={parent_email}
            placeholder="Parent Email"
            onChange={(e) => setParentEmail(e.target.value)}
            className={fieldClass("parent_email"), "bg-white/40 p-2 w-full rounded-lg"} 
            required 
          />
            {fieldErrors.parent_email && <p className="form-error">{fieldErrors.parent_email[0]}</p>}
        </div>
        <div>
          <label htmlFor="educational_level" className="form-label text-white">Educational Level</label>
          <select 
            id="educational_level" 
            value={educational_level}
            onChange={(e) => setEducationalLevel(Number(e.target.value))} 
            required
            className={(fieldErrors.educational_level ? "form-input-error" : "form-select"), "bg-white/40 p-2 w-full rounded-lg"}
          >
            <option value="">Select an educational level</option>
            {educational_levels.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
            {fieldErrors.educational_level && <p className="form-error">{fieldErrors.educational_level[0]}</p>}
        </div>
        <div>
          <label htmlFor="password" className="form-label text-white">Password</label>
          <input 
            type="password" 
            id="password" 
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass("password"), "bg-white/40 p-2 w-full rounded-lg"} 
            required 
          />
            {fieldErrors.password && <p className="form-error">{fieldErrors.password[0]}</p>}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="form-label text-white">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            value={confirm_password}
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={fieldClass("confirm_password"), "bg-white/40 p-2 w-full rounded-lg"} 
            required
          />
            {fieldErrors.confirm_password && <p className="form-error">{fieldErrors.confirm_password[0]}</p>}
        </div>
        <button type="submit" disabled={submitting}
          className="w-full bg-blue text-white font-bold py-3.5 rounded-xl hover:bg-navy-mid transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
          {submitting
            ? <><span className="btn-spinner" /> Creating your account…</>
            : <><UserCheck className="w-4 h-4" /> Join academy</>
          }
        </button>
        <p className="text-center text-xs text-white/30 mt-2">
          Already registered?{" "}
          <Link to="/login" className="text-sky hover:text-white transition-colors">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
