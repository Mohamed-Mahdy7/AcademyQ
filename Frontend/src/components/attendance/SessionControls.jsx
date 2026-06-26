export default function SessionControls({ selectedDate, notes, sessionTime, onDateChange, onNotesChange, onTimeChange }) {
  return (
    <div className="card-body mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="form-field">
          <label className="form-label">Session Date</label>
          <input
            type="date"
            className="form-input"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Session Time</label>
          <input
            type="time"
            className="form-input"
            value={sessionTime}
            onChange={(e) => onTimeChange(e.target.value)}
          />
        </div>
        <div className="form-field sm:col-span-2 lg:col-span-1">
          <label className="form-label">Session Notes</label>
          <input
            type="text"
            className="form-input"
            placeholder="Optional notes for this session..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}