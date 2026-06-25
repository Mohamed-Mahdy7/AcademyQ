import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserCheck, ChevronDown } from "lucide-react";
import { createStudentRequest } from "../../services/studentService";
import { toast } from "../../lib/toastBus";
import api from "../../api";


export default function StudentRegisterForm({ academyId = "", onSuccess }) {
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [parent_email, setParentEmail] = useState("");
  const [educational_level, setEducationalLevel] = useState("");
  const [academy, setAcademy] = useState(academyId);
  const [password, setPassword] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");
  const [educational_levels, setEducationalLevels] = useState([]);
  const [academies, setAcademies] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const showAcademyField = !academyId;

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
  }, [showAcademyField]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});

    if (password !== confirm_password) {
        setFieldErrors({ confirm_password: ["Passwords do not match"] });
        return;
    }

    if (showAcademyField && !academy) {
      setFieldErrors({ academy: ["Please select an academy."] });
      return;
    }

    setSubmitting(true);
    try {
      const response = await createStudentRequest({
        full_name, email, phone, parent_email,
        academy: academyId || academy,
        password, confirm_password,
        educational_level: Number(educational_level),
      });
      setSubmitting(false);
      toast.success("Student registered", `${full_name} has been added.`);
      onSuccess?.();
    } catch (error) {
      setSubmitting(false);
      if (error.response?.data?.code === "validation_error") {
          setFieldErrors(error.response.data.fields || {});
      } else {
          toast.error("Registration failed", "Please check the details and try again.");
      }
    }
  }

  function fieldClass(name) {
    return fieldErrors[name] ? "form-input-error" : "form-input";
  }

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        {showAcademyField && (
          <div className="flex flex-row items-center justify-between form-field">
            <label className="form-label">Academy</label>
            <select 
              value={academy} 
              onChange={(e) => setAcademy(e.target.value)}
              className={`${fieldClass("academy")} w-9/12 placeholder:text-gray-500 bg-gray-100`} 
              required
            >
              <option value="">Select an academy</option>
              {academies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {fieldErrors.academy && <p className="form-error">{fieldErrors.academy[0]}</p>}
          </div>
        )}
        <div className="flex flex-row items-center justify-between form-field">
          <label htmlFor="fullName" className="form-label m-0 text-black">Full Name</label>
          <input 
            type="text" 
            id="fullName" 
            value={full_name}
            placeholder="Full Name"
            onChange={(e) => setFullName(e.target.value)}
            className={`${fieldClass("full_name")} w-9/12 placeholder:text-gray-500 bg-gray-100`} 
            required 
          />
            {fieldErrors.full_name && <p className="form-error">{fieldErrors.full_name[0]}</p>}
        </div>
        <div className="flex flex-row items-center justify-between form-field">
          <label htmlFor="email" className="form-label m-0 text-black">Email</label>
          <input 
            type="email" 
            id="email" 
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            className={`${fieldClass("email")} w-9/12 placeholder:text-gray-500 bg-gray-100`} 
            required 
          />
            {fieldErrors.email && <p className="form-error">{fieldErrors.email[0]}</p>}
        </div>
        <div className="flex flex-row items-center justify-between form-field">
          <label htmlFor="phone" className="form-label m-0 text-black">Phone</label>
          <input 
            type="text" 
            id="phone" 
            value={phone}
            placeholder="Phone"
            onChange={(e) => setPhone(e.target.value)}
            className={`${fieldClass("phone")} w-9/12 placeholder:text-gray-500 bg-gray-100`} 
            required 
          />
            {fieldErrors.phone && <p className="form-error">{fieldErrors.phone[0]}</p>}
        </div>
        <div className="flex flex-row items-center justify-between form-field">
          <label htmlFor="parentEmail" className="form-label m-0 text-black">Parent email</label>
          <input 
            type="email" 
            id="parentEmail" 
            value={parent_email}
            placeholder="Parent Email"
            onChange={(e) => setParentEmail(e.target.value)}
            className={`${fieldClass("parent_email")} w-9/12 placeholder:text-gray-500 bg-gray-100`} 
            required 
          />
            {fieldErrors.parent_email && <p className="form-error">{fieldErrors.parent_email[0]}</p>}
        </div>
        <div className="flex flex-row items-center justify-between form-field">
          <label htmlFor="educational_level" className="form-label m-0 text-black">Educational Level</label>
          <select 
            id="educational_level" 
            value={educational_level}
            onChange={(e) => setEducationalLevel(Number(e.target.value))} 
            required
            className={`${
              (fieldErrors.educational_level ? "form-input-error" : "form-select")} 
              w-9/12 placeholder:text-gray-500 bg-gray-100`}
          >
            <option value="">Select an educational level</option>
            {educational_levels.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
            {fieldErrors.educational_level && <p className="form-error">{fieldErrors.educational_level[0]}</p>}
        </div>
        <div className="flex flex-row items-center justify-between form-field">
          <label htmlFor="password" className="form-label m-0 text-black">Password</label>
          <input 
            type="password" 
            id="password" 
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            className={`${fieldClass("password")} w-9/12 placeholder:text-gray-500 bg-gray-100`} 
            required 
          />
            {fieldErrors.password && <p className="form-error">{fieldErrors.password[0]}</p>}
        </div>
        <div className="flex flex-row items-center justify-between form-field">
          <label htmlFor="confirmPassword" className="form-label m-0 text-black">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            value={confirm_password}
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`${fieldClass("confirm_password")} w-9/12 placeholder:text-gray-500 bg-gray-100`} 
            required
          />
            {fieldErrors.confirm_password && <p className="form-error">{fieldErrors.confirm_password[0]}</p>}
        </div>
        <button type="submit" disabled={submitting}
          className="w-full btn-primary font-bold py-3.5 rounded-xl hover:bg-sky-mid transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
          {submitting
            ? <><span className="btn-spinner" /> Creating your account…</>
            : <><UserCheck className="w-4 h-4" /> Join academy</>
          }
        </button>
        <p className="text-center text-xs text-black/50 mt-2">
          Already registered?{" "}
          <Link to="/login" className="text-blue hover:text-black transition-colors">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
