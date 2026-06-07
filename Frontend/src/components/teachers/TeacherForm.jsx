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

export default function TeacherForm({ editingTeacher, onSubmit, onCancel, errors }) {
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
    <form onSubmit={handleSubmit}>
      <h2>{editingTeacher ? "Edit teacher" : "Add teacher"}</h2>

      {/* User ID — plain input for now, replace with dropdown tomorrow */}
      {!editingTeacher && (
        <div>
          <label>User ID</label>
          <input
            type="text"
            name="user_id"
            value={form.user_id}
            onChange={handleChange}
            placeholder="Paste user UUID here"
            required
          />
          {errors?.user_id && <p>{errors.user_id}</p>}
        </div>
      )}

      <div>
        <label>Rate per session (EGP)</label>
        <input
          type="number"
          name="rate_per_session"
          value={form.rate_per_session}
          onChange={handleChange}
          placeholder="e.g. 200"
          min="0"
          step="0.01"
          required
        />
        {errors?.rate_per_session && <p>{errors.rate_per_session}</p>}
      </div>

      <div>
        <label>Session duration</label>
        <div>
          <input
            type="number"
            name="session_duration_hours"
            value={form.session_duration_hours}
            onChange={handleChange}
            placeholder="Hours"
            min="0"
            max="12"
            required
          />
          <input
            type="number"
            name="session_duration_minutes"
            value={form.session_duration_minutes}
            onChange={handleChange}
            placeholder="Minutes"
            min="0"
            max="59"
          />
        </div>
        {errors?.session_duration && <p>{errors.session_duration}</p>}
      </div>

      {errors?.detail && <p>{errors.detail}</p>}

      <div>
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit">
          {editingTeacher ? "Save changes" : "Add teacher"}
        </button>
      </div>
    </form>
  );
}