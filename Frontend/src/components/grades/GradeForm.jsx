import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useGrades } from "../../context/gradecontext";
import { toast } from "../../lib/toastBus";
import api from "../../api";

export default function GradeForm({ enrollments = [], sessions = [], subjectName = "", classId, onSuccess }) {
  const { t } = useTranslation(["grades", "common"]);
  const { addGrade, findExistingGrade, editGrade } = useGrades();

  const [form, setForm] = useState({
    enrollment: "", session: "", subject_name: subjectName,
    score: "", max_score: "", assigned_at: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [attendedSessions, setAttendedSessions] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (!form.enrollment || !classId) {
      setAttendedSessions([]);
      setForm(prev => ({ ...prev, session: "" }));
      return;
    }
    const enrollment = enrollments.find(e => e.id === form.enrollment);
    if (!enrollment) return;

    setLoadingAttendance(true);
    api.get(`/api/students/${enrollment.student_id}/attendance/history/?class_id=${classId}`)
      .then(res => {
        const history = res.data.results ?? res.data;
        const presentNums = history.filter(r => r.present).map(r => r.session_num);
        setAttendedSessions(sessions.filter(s => presentNums.includes(s.session_num)));
        setForm(prev => ({ ...prev, session: "" }));
      })
      .catch(() => setAttendedSessions([]))
      .finally(() => setLoadingAttendance(false));
  }, [form.enrollment, classId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({});
    setConfirmOverwrite(false);
  };

  const resetForm = () => {
    setForm({ enrollment: "", session: "", subject_name: subjectName, score: "", max_score: "", assigned_at: "" });
    setAttendedSessions([]);
    setConfirmOverwrite(false);
    setPendingPayload(null);
  };

  const handleConfirmOverwrite = async () => {
    try {
      const existing = await findExistingGrade(pendingPayload.enrollment, pendingPayload.session, pendingPayload.subject_name);
      if (!existing) {
        toast.danger(t("failed_update_grade"), "Could not find the existing grade.");
        setConfirmOverwrite(false);
        return;
      }
      await editGrade(existing.id, pendingPayload);
      toast.success(t("grade_updated"), t("grade_updated_desc"));
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      const data = error.response?.data;
      toast.danger(t("failed_update_grade"), data?.detail || error.message);
      setConfirmOverwrite(false);
    }
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    if (!form.enrollment || !form.score || !form.max_score || !form.assigned_at || !form.session) {
      toast.danger(t("missing_fields"), t("missing_fields_desc"));
      return;
    }
    if (Number(form.max_score) <= 0) {
      setFieldErrors({ max_score: ["Max score must be greater than 0."] });
      return;
    }
    if (Number(form.score) > Number(form.max_score)) {
      setFieldErrors({ score: ["Score cannot be greater than max score."] });
      return;
    }
    const selectedSession = sessions.find(s => s.id === form.session);
    if (selectedSession && form.assigned_at < selectedSession.session_date) {
      setFieldErrors({ assigned_at: ["Assigned date cannot be before the session date."] });
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    if (selectedSession && selectedSession.session_date > today) {
        toast.danger(t("missing_fields"), "This session has not been conducted yet.");
        return;
    }
    const payload = {
      enrollment: form.enrollment, session: form.session,
      subject_name: form.subject_name, score: form.score,
      max_score: form.max_score, assigned_at: form.assigned_at,
    };

    try {
      const result = await addGrade(payload);
      if (result.isDuplicate) { setPendingPayload(payload); setConfirmOverwrite(true); return; }
      toast.success(t("grade_saved"), t("grade_saved_desc"));
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      const data = error.response?.data;
      if (data?.fields) setFieldErrors(data.fields);
      else toast.danger(t("failed_save_grade"), data?.detail || error.message);
    }
  };

  return (
    <div className="card-body space-y-4 max-w-md">
      <h3 className="heading-3">{t("add_grade")}</h3>

      {confirmOverwrite && (
        <div className="alert alert-warning">
          <span>{t("duplicate_grade_question")}</span>
          <div className="flex gap-2 mt-2">
            <button className="btn-primary" onClick={handleConfirmOverwrite}>{t("yes_update")}</button>
            <button className="btn-muted" onClick={() => setConfirmOverwrite(false)}>{t("cancel")}</button>
          </div>
        </div>
      )}

      <div className="form-field">
        <label className="form-label">{t("student")} <span className="form-required">*</span></label>
        <select name="enrollment" value={form.enrollment} onChange={handleChange} className="form-select">
          <option value="">{t("select_student")}</option>
          {enrollments.map((e) => <option key={e.id} value={e.id}>{e.student_name}</option>)}
        </select>
        {fieldErrors.enrollment && <p className="form-error">{fieldErrors.enrollment[0]}</p>}
      </div>

      <div className="form-field">
        <label className="form-label">{t("session")} <span className="form-required">*</span></label>
        <select name="session" value={form.session} onChange={handleChange} className="form-select"
          disabled={!form.enrollment || loadingAttendance}>
          <option value="">
            {!form.enrollment ? t("select_session_first")
              : loadingAttendance ? t("loading_sessions")
              : attendedSessions.length === 0 ? t("no_attended_sessions")
              : t("select_session")}
          </option>
          {attendedSessions.map((s) => (
            <option key={s.id} value={s.id}>{t("session_label", { num: s.session_num, date: s.session_date })}</option>
          ))}
        </select>
        {fieldErrors.session && <p className="form-error">{fieldErrors.session[0]}</p>}
      </div>

      <div className="form-field">
        <label className="form-label">{t("subject")}</label>
        <input type="text" value={subjectName} disabled className="form-input-disabled" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="form-field">
          <label className="form-label">{t("score")} <span className="form-required">*</span></label>
          <input type="number" name="score" value={form.score} onChange={handleChange} className="form-input" />
          {fieldErrors.score && <p className="form-error">{fieldErrors.score[0]}</p>}
        </div>
        <div className="form-field">
          <label className="form-label">{t("max_score")} <span className="form-required">*</span></label>
          <input type="number" name="max_score" value={form.max_score} onChange={handleChange} className="form-input" />
          {fieldErrors.max_score && <p className="form-error">{fieldErrors.max_score[0]}</p>}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">{t("assigned_date")} <span className="form-required">*</span></label>
        <input type="date" name="assigned_at" value={form.assigned_at} onChange={handleChange} className="form-input"
          min={sessions.find(s => s.id === form.session)?.session_date || undefined} />
        {fieldErrors.assigned_at && <p className="form-error">{fieldErrors.assigned_at[0]}</p>}
      </div>

      <button className="btn-primary w-full" onClick={handleSubmit} disabled={confirmOverwrite}>
        {t("save_grade")}
      </button>
    </div>
  );
}