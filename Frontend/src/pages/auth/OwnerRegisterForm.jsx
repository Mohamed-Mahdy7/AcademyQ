import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, ShieldCheck, Zap, BookOpen } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "../../lib/toastBus";


export default function OwnerRegisterForm() {
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
      toast.success("Academy registered", "Welcome to AcademiQ.");
      navigate("/dashboard");
    } else if (result.error?.response?.data?.code === "validation_error") {
      setFieldErrors(result.error.response.data.fields || {});
    } else {
      toast.danger("Registration failed", "Please check your details and try again.");
    }
  }

  function fieldClass(name) {
    return fieldErrors[name] ? "form-input-error" : "form-input w-9/12";
  }

  return (
    <div className="form-card bg-white rounded-2xl py-2 p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-row items-center justify-between form-field">
        <label className="form-label m-0 text-black">Academy name</label>
        <input 
          type="text" 
          id="academyName" 
          value={academy_name}
          placeholder="Academy Name"
          onChange={(e) => setAcademyName(e.target.value)}
          className={`${fieldClass("academy_name")} w-5/6 placeholder:text-gray-500 bg-gray-100`} 
          required 
        />
        {fieldErrors.academy_name && <p className="form-error">{fieldErrors.academy_name[0]}</p>}
      </div>
      <div className="flex flex-row items-center justify-between form-field">
        <label className="form-label m-0 text-black">Academy email</label>
        <input 
          type="email" 
          id="academyEmail" 
          value={academy_email}
          placeholder="Academy Email"
          onChange={(e) => setAcademyEmail(e.target.value)}
          className={`${fieldClass("academy_email")} w-5/6 placeholder:text-gray-500 bg-gray-100`} 
          required 
        />
        {fieldErrors.academy_email && <p className="form-error">{fieldErrors.academy_email[0]}</p>}
      </div>
      <div className="flex flex-row items-center justify-between form-field">
        <label className="form-label m-0 text-black">Academy phone</label>
        <input 
          type="text" 
          id="academyPhone" 
          value={academy_phone}
          placeholder="Academy Phone"
          onChange={(e) => setAcademyPhone(e.target.value)}
          className={`${fieldClass("academy_phone")} w-5/6 placeholder:text-gray-500 bg-gray-100`} 
          required 
        />
        {fieldErrors.academy_phone && <p className="form-error">{fieldErrors.academy_phone[0]}</p>}
      </div>
      <div className="flex flex-row items-center justify-between form-field">
        <label className="form-label m-0 text-black">Address</label>
        <input 
          type="text" 
          id="address" 
          value={address}
          placeholder="Address"
          onChange={(e) => setAcademyAddress(e.target.value)}
          className={`${fieldClass("address")} w-5/6 placeholder:text-gray-500 bg-gray-100`} 
          required 
        />
        {fieldErrors.address && <p className="form-error">{fieldErrors.address[0]}</p>}
      </div>
      <div className="flex flex-row items-center justify-between form-field">
        <label className="form-label m-0 text-black">Owner name</label>
        <input 
          type="text" 
          id="fullName" 
          value={full_name}
          placeholder="Full Name"
          onChange={(e) => setFullName(e.target.value)}
          className={`${fieldClass("full_name")} w-5/6 placeholder:text-gray-500 bg-gray-100`} 
          required 
        />
        {fieldErrors.full_name && <p className="form-error">{fieldErrors.full_name[0]}</p>}
      </div>
      <div className="flex flex-row items-center justify-between form-field">
        <label className="form-label m-0 text-black">Owner email</label>
        <input 
          type="email" 
          id="email" 
          value={email}
          placeholder="Owner Email"
          onChange={(e) => setEmail(e.target.value)}
          className={`${fieldClass("email")} w-5/6 placeholder:text-gray-500 bg-gray-100`} 
          required 
        />
        {fieldErrors.email && <p className="form-error">{fieldErrors.email[0]}</p>}
      </div>
      <div className="flex flex-row items-center justify-between form-field">
        <label className="form-label m-0 text-black">Owner phone</label>
        <input 
          type="text" 
          id="phone" 
          value={phone}
          placeholder="Owner Phone"
          onChange={(e) => setPhone(e.target.value)}
          className={`${fieldClass("phone")} w-5/6 placeholder:text-gray-500 bg-gray-100`} 
          required 
        />
        {fieldErrors.phone && <p className="form-error">{fieldErrors.phone[0]}</p>}
      </div>
      <div className="flex flex-row items-center justify-between form-field">
        <label className="form-label m-0 text-black">Password</label>
        <input 
          type="password" 
          id="password" 
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className={`${fieldClass("password")} w-5/6 placeholder:text-gray-500 bg-gray-100`} 
          required 
        />
        {fieldErrors.password && <p className="form-error">{fieldErrors.password[0]}</p>}
      </div>
      <div className="flex flex-row items-center justify-between form-field">
        <label className="form-label m-0 text-black">Confirm password</label>
        <input 
          type="password" 
          id="confirmPassword" 
          value={confirm_password}
          placeholder="Confirm Password"
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`${fieldClass("confirm_password")} w-5/6 placeholder:text-gray-500 bg-gray-100`} 
          required 
        />
        {fieldErrors.confirm_password && <p className="form-error">{fieldErrors.confirm_password[0]}</p>}
      </div>
      <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
        {submitting ? <span className="btn-spinner" /> : <><Building2 className="w-4 h-4" /> Create academy account</>}
      </button>
      <div className="flex items-center justify-center gap-5 pt-4 border-t border-border">
        {[
          { icon: ShieldCheck, label: "Secure" },
          { icon: Zap, label: "Instant setup" },
          { icon: BookOpen, label: "Free plan" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-blue">
            <Icon className="w-3.5 h-3.5" />{label}
          </div>
        ))}
      </div>
    </form>
    </div>
  );
}
