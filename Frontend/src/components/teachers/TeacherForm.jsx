import { useEffect, useState } from "react";
import { getUsersRequest } from "../../services/usersService";
import { useTranslation } from "react-i18next";

const EMPTY_FORM = {
  user_id: "",
};

export default function TeacherForm({ editingTeacher, onSubmit, onCancel, errors, submitting }) {
  const { t } = useTranslation("teacher");
  const [form, setForm] = useState(EMPTY_FORM);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!editingTeacher) {
      setLoadingUsers(true);
      getUsersRequest()
        .then((res) => {
          const allUsers = res.data.results ?? res.data;
          const teacherUsers = allUsers.filter((u) => u.role === "T");
          setAvailableUsers(teacherUsers);
        })
        .catch((err) => console.error("Failed to load users", err))
        .finally(() => setLoadingUsers(false));
    }
  }, [editingTeacher]);

  useEffect(() => {
    if (editingTeacher) {
      setForm({ user_id: editingTeacher.user_id || "" });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingTeacher]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const selectedUser = availableUsers.find((u) => u.id === form.user_id);
    const payload = {
      user_id: form.user_id,
      academy_id: selectedUser?.academy_id,
    };
    onSubmit(payload, editingTeacher?.id);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-md">

        <div className="modal-header">
          <h2 className="modal-title">
            {editingTeacher ? t("form.edit_title") : t("form.add_title")}
          </h2>
          <button className="btn-icon modal-close" onClick={onCancel}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {!editingTeacher && (
              <div className="form-field">
                <label className="form-label">
                  {t("form.user_account_label")} <span className="form-required">*</span>
                </label>
                <select
                  name="user_id"
                  value={form.user_id}
                  onChange={handleChange}
                  className={errors?.user_id ? "form-select border-danger" : "form-select"}
                  required
                >
                  <option value="">
                    {loadingUsers ? t("form.loading_users") : t("form.select_user")}
                  </option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} — {u.email}
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 && !loadingUsers && (
                  <p className="form-hint" style={{ color: "var(--color-warning)" }}>
                    {t("form.no_users")}
                  </p>
                )}
                {errors?.user_id && (
                  <p className="form-error">
                    {Array.isArray(errors.user_id) ? errors.user_id[0] : errors.user_id}
                  </p>
                )}
              </div>
            )}

            {errors?.detail && (
              <div className="alert alert-danger">
                <p className="alert-desc">{errors.detail}</p>
              </div>
            )}

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-muted" onClick={onCancel}>
              {t("form.cancel")}
            </button>
            <button
              type="submit"
              className={`btn-primary ${submitting ? "btn-disabled" : ""}`}
              disabled={submitting}
            >
              {submitting ? (
                <><span className="btn-spinner" /> {t("form.saving")}</>
              ) : editingTeacher ? t("form.save_submit") : t("form.add_submit")}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}