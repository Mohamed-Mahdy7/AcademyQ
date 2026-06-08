import { useEffect, useState } from "react";

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
  const [form, setForm] = useState(EMPTY_FORM);

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
    const payload = {
      user_id: form.user_id,
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
          <button className="btn-icon modal-close" onClick={onCancel} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* User ID — only on create */}
            {!editingTeacher && (
              <div className="form-field">
                <label className="form-label">
                  User ID <span className="form-required">*</span>
                </label>
                <input
                  type="text"
                  name="user_id"
                  value={form.user_id}
                  onChange={handleChange}
                  placeholder="Paste user UUID here"
                  className={errors?.user_id ? "form-input-error" : "form-input"}
                  required
                />
                {errors?.user_id && (
                  <p className="form-error">{Array.isArray(errors.user_id) ? errors.user_id[0] : errors.user_id}</p>
                )}
                <p className="form-hint">The UUID of an existing user account with role = teacher</p>
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
                <p className="form-error">{Array.isArray(errors.rate_per_session) ? errors.rate_per_session[0] : errors.rate_per_session}</p>
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
                <p className="form-error">{Array.isArray(errors.session_duration) ? errors.session_duration[0] : errors.session_duration}</p>
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
                <>
                  <span className="btn-spinner" />
                  Saving...
                </>
              ) : editingTeacher ? "Save changes" : "Add teacher"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}