import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, ShieldCheck, Zap, BookOpen } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "../../lib/toastBus";

const inputCls =
  "w-full border border-white/20 bg-white/10 text-white placeholder:text-white/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-sky/60 focus:ring-2 focus:ring-sky/20 transition-all";
const inputErrCls =
  "w-full border border-danger bg-white/10 text-white placeholder:text-white/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-danger focus:ring-2 focus:ring-danger/20 transition-all";
const labelCls = "block text-sm font-medium text-white/80 mb-1.5";

export default function OwnerRegisterForm() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    academy_name: "", academy_email: "", academy_phone: "",
    address: "", full_name: "", email: "",
    phone: "", password: "", confirm_password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const inputClass = (name) => fieldErrors[name] ? inputErrCls : inputCls;

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});

    if (form.password !== form.confirm_password) {
      setFieldErrors({ confirm_password: ["Passwords do not match"] });
      return;
    }

    setSubmitting(true);
    const result = await register(form);
    setSubmitting(false);

    if (result.success) {
      toast.success("Academy registered", "Welcome to AcademiQ.");
      navigate("/dashboard");
    } else if (result.error?.response?.data?.code === "validation_error") {
      setFieldErrors(result.error.response.data.fields || {});
    } else {
      toast.error("Registration failed", "Please check your details and try again.");
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 bg-sky/15 border border-sky/25 rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5 text-sky" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Register your academy</h3>
          <p className="text-xs text-white/40">Free — no credit card required</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Academy Name */}
        <div>
          <label className={labelCls}>Academy name *</label>
          <input className={inputClass("academy_name")} placeholder="Rainbow Academy"
            value={form.academy_name} onChange={set("academy_name")} required />
          {fieldErrors.academy_name && <p className="text-danger text-xs mt-1">{fieldErrors.academy_name[0]}</p>}
        </div>

        {/* Academy Email */}
        <div>
          <label className={labelCls}>Academy email *</label>
          <input type="email" className={inputClass("academy_email")} placeholder="info@academy.com"
            value={form.academy_email} onChange={set("academy_email")} required />
          {fieldErrors.academy_email && <p className="text-danger text-xs mt-1">{fieldErrors.academy_email[0]}</p>}
        </div>

        {/* Academy Phone */}
        <div>
          <label className={labelCls}>Academy phone *</label>
          <input type="tel" className={inputClass("academy_phone")} placeholder="01012345678"
            value={form.academy_phone} onChange={set("academy_phone")} required />
          {fieldErrors.academy_phone && <p className="text-danger text-xs mt-1">{fieldErrors.academy_phone[0]}</p>}
        </div>

        {/* Address */}
        <div>
          <label className={labelCls}>Address *</label>
          <input className={inputClass("address")} placeholder="Cairo, Egypt"
            value={form.address} onChange={set("address")} required />
          {fieldErrors.address && <p className="text-danger text-xs mt-1">{fieldErrors.address[0]}</p>}
        </div>

        {/* Owner Name */}
        <div>
          <label className={labelCls}>Owner name *</label>
          <input className={inputClass("full_name")} placeholder="Mohamed Ali"
            value={form.full_name} onChange={set("full_name")} required />
          {fieldErrors.full_name && <p className="text-danger text-xs mt-1">{fieldErrors.full_name[0]}</p>}
        </div>

        {/* Owner Email */}
        <div>
          <label className={labelCls}>Owner email *</label>
          <input type="email" className={inputClass("email")} placeholder="owner@academy.com"
            value={form.email} onChange={set("email")} required />
          {fieldErrors.email && <p className="text-danger text-xs mt-1">{fieldErrors.email[0]}</p>}
        </div>

        {/* Owner Phone */}
        <div>
          <label className={labelCls}>Owner phone *</label>
          <input type="tel" className={inputClass("phone")} placeholder="01012345678"
            value={form.phone} onChange={set("phone")} required />
          {fieldErrors.phone && <p className="text-danger text-xs mt-1">{fieldErrors.phone[0]}</p>}
        </div>

        {/* Password */}
        <div>
          <label className={labelCls}>Password *</label>
          <input type="password" className={inputClass("password")} placeholder="Min. 8 characters"
            value={form.password} onChange={set("password")} required />
          {fieldErrors.password && <p className="text-danger text-xs mt-1">{fieldErrors.password[0]}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className={labelCls}>Confirm password *</label>
          <input type="password" className={inputClass("confirm_password")} placeholder="Repeat password"
            value={form.confirm_password} onChange={set("confirm_password")} required />
          {fieldErrors.confirm_password && <p className="text-danger text-xs mt-1">{fieldErrors.confirm_password[0]}</p>}
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-sky text-navy font-bold py-3.5 rounded-xl hover:bg-white transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
          {submitting
            ? <><span className="btn-spinner" /> Creating your academy…</>
            : <><Building2 className="w-4 h-4" /> Create academy account</>
          }
        </button>

        <p className="text-center text-xs text-white/30 mt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-sky hover:text-white transition-colors">Sign in</Link>
        </p>
      </form>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-5 mt-6 pt-5 border-t border-white/10">
        {[
          { icon: ShieldCheck, label: "Secure"        },
          { icon: Zap,         label: "Instant setup" },
          { icon: BookOpen,    label: "Free plan"     },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-white/30">
            <Icon className="w-3.5 h-3.5" />{label}
          </div>
        ))}
      </div>
    </div>
  );
}
