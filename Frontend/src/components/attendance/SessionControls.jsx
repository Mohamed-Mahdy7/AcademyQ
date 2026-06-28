import { useTranslation } from "react-i18next";

export default function SessionControls({ selectedDate, notes, sessionTime, classStartDate, classEndDate, onDateChange, onNotesChange, onTimeChange }) {
  const { t } = useTranslation("attendance");

  return (
    <div className="card-body mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="form-field">
          <label className="form-label">{t("session_date")}</label>
          <input type="date" className="form-input" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">{t("session_time")}</label>
          <input type="time" className="form-input" value={sessionTime} onChange={(e) => onTimeChange(e.target.value)} />
        </div>
        <div className="form-field sm:col-span-2 lg:col-span-1">
          <label className="form-label">{t("session_notes")}</label>
          <input
            type="text"
            className="form-input"
            placeholder={t("session_notes_placeholder")}
            value={notes}
            min={classStartDate || undefined}
            max={classEndDate || undefined}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}