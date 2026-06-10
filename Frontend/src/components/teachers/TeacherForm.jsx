import { useEffect, useState, useContext } from "react";
import { getUsersRequest } from "../../services/usersService";
import { AuthContext } from "../../context/AuthContext";
import { AcademyContext } from "../../context/AcademyContext";

const EMPTY_FORM = {
  user_id: "",
  rate_per_session: "",
  session_duration_hours: "",
  session_duration_minutes: "",
};

function parseDurationToISO(hours, minutes) {
  const h = String(parseInt(hours) || 0).padStart(2, "0");
  const m = String(parseInt(minutes) || 0).padStart(2, "0");
  return `${h}:${m}:00`;
}

export default function TeacherForm({ editingTeacher, onSubmit, onCancel, errors, submitting }) {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState(EMPTY_FORM);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { academy } = useContext(AcademyContext);

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
      const match = editingTeacher.session_duration?.match(
        /(?:(\d+)\s+day[s]?\s+)?(\d+):(\d+)/
      );
      const days = parseInt(match?.[1] || 0);
      const hours = parseInt(match?.[2] || 0) + days * 24;
      const mins = parseInt(match?.[3] || 0);
      setForm({
        user_id: editingTeacher.user_id || "",
        rate_per_session: editingTeacher.rate_per_session || "",
        session_duration_hours: String(hours),
        session_duration_minutes: String(mins),
      });
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
    const academyId = selectedUser?.academy_id || academy?.id;

    const payload = {
      user_id: form.user_id,
      academy_id: academyId,
      rate_per_session: form.rate_per_session,
      session_duration: parseDurationToISO(
        form.session_duration_hours,
        form.session_duration_minutes
      ),
    };
    onSubmit(payload, editingTeacher?.id);
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-md">

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {editingTeacher ? "Edit teacher" : "Add teacher"}
          </h2>
          <button className="btn-icon modal-close" onClick={onCancel}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* User dropdown — only on create */}
            {!editingTeacher && (
              <div className="form-field">
                <label className="form-label">
                  User account <span className="form-required">*</span>
                </label>
                <select
                  name="user_id"
                  value={form.user_id}
                  onChange={handleChange}
                  className={errors?.user_id ? "form-select border-danger" : "form-select"}
                  required
                >
                  <option value="">
                    {loadingUsers ? "Loading users..." : "Select a teacher user"}
                  </option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} — {u.email}
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 && !loadingUsers && (
                  <p className="form-hint text-warning">
                    No available users with role = Teacher. Create a user first.
                  </p>
                )}
                {errors?.user_id && (
                  <p className="form-error">
                    {Array.isArray(errors.user_id) ? errors.user_id[0] : errors.user_id}
                  </p>
                )}
              </div>
            )}

            {/* Rate per session */}
            <div className="form-field">
              <label className="form-label">
                Rate per session (EGP) <span className="form-required">*</span>
              </label>
              <input
                type="number"
                name="rate_per_session"
                value={form.rate_per_session}
                onChange={handleChange}
                placeholder="e.g. 200"
                min="0"
                step="0.01"
                className={errors?.rate_per_session ? "form-input-error" : "form-input"}
                required
              />
              {errors?.rate_per_session && (
                <p className="form-error">
                  {Array.isArray(errors.rate_per_session) ? errors.rate_per_session[0] : errors.rate_per_session}
                </p>
              )}
            </div>

            {/* Session duration */}
            <div className="form-field">
              <label className="form-label">
                Session duration <span className="form-required">*</span>
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    name="session_duration_hours"
                    value={form.session_duration_hours}
                    onChange={handleChange}
                    placeholder="Hours"
                    min="0"
                    max="12"
                    className="form-input"
                    required
                  />
                  <p className="form-hint">hours</p>
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    name="session_duration_minutes"
                    value={form.session_duration_minutes}
                    onChange={handleChange}
                    placeholder="Minutes"
                    min="0"
                    max="59"
                    className="form-input"
                  />
                  <p className="form-hint">minutes</p>
                </div>
              </div>
              {errors?.session_duration && (
                <p className="form-error">
                  {Array.isArray(errors.session_duration) ? errors.session_duration[0] : errors.session_duration}
                </p>
              )}
            </div>

            {/* General error */}
            {errors?.detail && (
              <div className="alert alert-danger">
                <p className="alert-desc">{errors.detail}</p>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-muted" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-primary ${submitting ? "btn-disabled" : ""}`}
              disabled={submitting}
            >
              {submitting ? (
                <><span className="btn-spinner" /> Saving...</>
              ) : editingTeacher ? "Save changes" : "Add teacher"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}