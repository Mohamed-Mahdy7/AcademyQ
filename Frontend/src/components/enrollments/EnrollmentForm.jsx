import { useEffect, useState } from "react";
import { getStudentsRequest } from "../../services/studentService";
import { useTranslation, Trans } from "react-i18next";

const EMPTY_FORM = {
  student_id: "",
  start_date: new Date().toISOString().split("T")[0], // ← today by default
  status: "active",
};

export default function EnrollmentForm({
  classId,
  classPrice,
  classStart, 
  editingEnrollment,
  onSubmit,
  onCancel,
  errors,
  submitting,
}) {
  const { t } = useTranslation("enrollment");
  const [form, setForm] = useState(EMPTY_FORM);
  const [students, setStudents] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    getStudentsRequest()
      .then((res) => {
        const allUsers = res.data.results ?? res.data;
        setStudents(allUsers);
      })
      .catch((err) => console.error("Failed to load users", err))
      .finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => {
    if (editingEnrollment) {
      setForm({
        student_id: editingEnrollment.student_id || "",
        start_date: editingEnrollment.start_date || "",
        status: editingEnrollment.status || "active",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingEnrollment]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      student_id: form.student_id,
      class_id: classId,
      start_date: form.start_date,
      status: form.status,
      class_price: classPrice,
    }, editingEnrollment?.id);
  }

  const dateMin = classStart
      ? new Date(new Date(classStart).getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString().split("T")[0]
      : undefined;

  const dateMax = classStart || undefined;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-md">

        <div className="modal-header">
          <h2 className="modal-title">
            {editingEnrollment ? t("form.edit_title") : t("form.add_title")}
          </h2>
          <button className="btn-icon modal-close" onClick={onCancel}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Class price info */}
            {classPrice && (
              <div className="alert alert-info">
                <p className="alert-desc">
                  <Trans
                    i18nKey="enrollment:form.class_price_desc"
                    values={{ price: parseFloat(classPrice).toFixed(2) }}
                    components={{ strong: <strong /> }}
                  />
                </p>
              </div>
            )}

            {/* Student dropdown — only on create */}
            {!editingEnrollment && (
              <div className="form-field">
                <label className="form-label">
                  {t("form.student_label")} <span className="form-required">*</span>
                </label>
                <select
                  name="student_id"
                  value={form.student_id}
                  onChange={handleChange}
                  className={errors?.student_id ? "form-select border-danger" : "form-select"}
                  required
                >
                  <option value="">
                    {loadingUsers ? t("form.loading_students") : t("form.select_student")}
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} — {s.email}
                    </option>
                  ))}
                </select>
                {errors?.student_id && (
                  <p className="form-error">
                    {Array.isArray(errors.student_id) ? errors.student_id[0] : errors.student_id}
                  </p>
                )}
              </div>
            )}

            {/* Start date */}
            <div className="form-field">
              <label className="form-label">
                {t("form.start_date_label")} <span className="form-required">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                min={dateMin}
                max={dateMax}
                className={errors?.start_date ? "form-input-error" : "form-input"}
                disabled={editingEnrollment ? true : false}
                required
              />
              {classStart && (
                  <p className="form-hint">
                      {t("form.start_date_hint", { classStart })}
                  </p>
              )}
            </div>

            {/* Status — only on edit */}
            {editingEnrollment && (
              <div className="form-field">
                <label className="form-label">{t("form.status_label")}</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="active">{t("form.status_active")}</option>
                  <option value="paused">{t("form.status_paused")}</option>
                  <option value="dropped">{t("form.status_dropped")}</option>
                  <option value="completed">{t("form.status_completed")}</option>
                </select>
              </div>
            )}

            {errors?.detail && (
              <div className="alert alert-danger">
                <p className="alert-desc">{errors.detail}</p>
              </div>
            )}

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-muted" onClick={onCancel}>{t("form.cancel")}</button>
            <button
              type="submit"
              className={`btn-primary ${submitting ? "btn-disabled" : ""}`}
              disabled={submitting}
            >
              {submitting ? (
                <><span className="btn-spinner" /> {t("form.saving")}</>
              ) : editingEnrollment ? t("form.save_submit") : t("form.add_submit")}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}