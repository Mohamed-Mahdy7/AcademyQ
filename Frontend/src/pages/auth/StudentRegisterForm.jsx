import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserCheck, ChevronDown } from "lucide-react";
import { createStudentRequest } from "../../services/studentService";
import { useTranslation } from "react-i18next";
import { toast } from "../../lib/toastBus";
import api from "../../api";


export default function StudentRegisterForm({ academyId = "", onSuccess, submit, heading }) {
  const { t } = useTranslation(["students", "common"])
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
        toast.warning(t("common:could_not_load_educational_levels"), t("common:try_refreshing"));
    }
  }

  async function fetchAcademies() {
    try {
        const response = await api.get("api/auth/academies/");
        setAcademies(response.data);
    } catch (error) {
        toast.warning(t("common:could_not_load_academies"), t("common:try_refreshing"));
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
        setFieldErrors({ confirm_password: [t("common:passwords_do_not_match")] });
        return;
    }

    if (showAcademyField && !academy) {
      setFieldErrors({ academy: [t("common:please_select_academy")] });
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
      toast.success(t("student_registered"), `${full_name} ${t("student_added")}`);
      onSuccess?.();
    } catch (error) {
      setSubmitting(false);
      if (error.response?.data?.code === "validation_error") {
          setFieldErrors(error.response.data.fields || {});
      } else {
          toast.error(t("registration_failed"), t("check_details_try_again"));
      }
    }
  }

  function fieldClass(name) {
    return fieldErrors[name] ? "form-input-error" : "form-input";
  }

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-8">
      {heading &&
        <div className="my-2">
          <h1 className="heading-1">{heading}</h1>
        </div>
      }
      <form onSubmit={handleSubmit} className="space-y-4">
        {showAcademyField && (
          <div className="form-field">
            <label className="form-label">{t("common:academy")}</label>
            <select 
              value={academy} 
              onChange={(e) => setAcademy(e.target.value)}
              className={`${fieldClass("academy")} form-input placeholder:text-gray-500 bg-gray-100`} 
              required
            >
              <option value="">{t("common:select_academy")}</option>
              {academies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {fieldErrors.academy && <p className="form-error">{fieldErrors.academy[0]}</p>}
          </div>
        )}
        <div className="form-field">
          <label htmlFor="fullName" className="form-label m-0 text-black">{t("full_name")}</label>
          <input 
            type="text" 
            id="fullName" 
            value={full_name}
            placeholder={t("common:full_name_placeholder")}
            onChange={(e) => setFullName(e.target.value)}
            className={`${fieldClass("full_name")} form-input placeholder:text-gray-500 bg-gray-100`} 
            required 
          />
            {fieldErrors.full_name && <p className="form-error">{fieldErrors.full_name[0]}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="email" className="form-label m-0 text-black">{t("common:email")}</label>
          <input 
            type="email" 
            id="email" 
            value={email}
            placeholder={t("common:email_placeholder")}
            onChange={(e) => setEmail(e.target.value)}
            className={`${fieldClass("email")} form-input placeholder:text-gray-500 bg-gray-100`} 
            required 
          />
            {fieldErrors.email && <p className="form-error">{fieldErrors.email[0]}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="phone" className="form-label m-0 text-black">{t("common:phone")}</label>
          <input 
            type="text" 
            id="phone" 
            value={phone}
            placeholder={t("common:phone_placeholder")}
            onChange={(e) => setPhone(e.target.value)}
            className={`${fieldClass("phone")} form-input placeholder:text-gray-500 bg-gray-100`} 
            required 
          />
            {fieldErrors.phone && <p className="form-error">{fieldErrors.phone[0]}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="parentEmail" className="form-label m-0 text-black">{t("parent_email")}</label>
          <input 
            type="email" 
            id="parentEmail" 
            value={parent_email}
            placeholder={t("common:parent_email_placeholder")}
            onChange={(e) => setParentEmail(e.target.value)}
            className={`${fieldClass("parent_email")} form-input placeholder:text-gray-500 bg-gray-100`} 
            required 
          />
            {fieldErrors.parent_email && <p className="form-error">{fieldErrors.parent_email[0]}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="educational_level" className="form-label m-0 text-black">{t("educational_level")}</label>
          <select 
            id="educational_level" 
            value={educational_level}
            onChange={(e) => setEducationalLevel(Number(e.target.value))} 
            required
            className={`${
              (fieldErrors.educational_level ? "form-input-error" : "form-select")} 
              form-input placeholder:text-gray-500 bg-gray-100`}
          >
            <option value="">{t("select_educational_level")}</option>
            {educational_levels.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
            {fieldErrors.educational_level && <p className="form-error">{fieldErrors.educational_level[0]}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="password" className="form-label m-0 text-black">{t("common:password")}</label>
          <input 
            type="password" 
            id="password" 
            value={password}
            placeholder={t("common:password_placeholder")}
            onChange={(e) => setPassword(e.target.value)}
            className={`${fieldClass("password")} form-input placeholder:text-gray-500 bg-gray-100`} 
            required 
          />
            {fieldErrors.password && <p className="form-error">{fieldErrors.password[0]}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="confirmPassword" className="form-label m-0 text-black">{t("common:confirm_password")}</label>
          <input 
            type="password" 
            id="confirmPassword" 
            value={confirm_password}
            placeholder={t("common:confirm_password_placeholder")}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`${fieldClass("confirm_password")} form-input placeholder:text-gray-500 bg-gray-100`} 
            required
          />
            {fieldErrors.confirm_password && <p className="form-error">{fieldErrors.confirm_password[0]}</p>}
        </div>
        <button type="submit" disabled={submitting}
          className="w-full btn-primary font-bold py-3.5 rounded-xl hover:bg-sky-mid transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
          {submitting
            ? <><span className="btn-spinner" /> {t("creating_account")}</>
            : <><UserCheck className="w-4 h-4" /> {submit}</>
          }
        </button>
        <p className="text-center text-sm text-black/50 mt-2">
          {t("common:already_registered")}{" "}
          <Link to="/login" className="text-blue hover:text-black transition-colors">{t("common:sign_in")}</Link>
        </p>
      </form>
    </div>
  );
}
