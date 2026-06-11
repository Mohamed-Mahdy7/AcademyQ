import { useState } from "react";
import api from "../../api";

export default function GenerateSessionsModal({ classId, classStartDate, classEndDate, onClose, onSuccess }) {
  const [startDate, setStartDate] = useState(classStartDate || "");
  const [endDate, setEndDate] = useState(classEndDate || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      setError("Both dates are required.");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be after start date.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`/api/classes/${classId}/generate-sessions/`, {
        start_date: startDate,
        end_date: endDate,
      });
      onSuccess(res.data);
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || "Failed to generate sessions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-md">
        <div className="modal-header">
          <h3 className="modal-title">Generate Sessions</h3>
          <button className="btn-icon modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-danger mb-4">
              <span className="alert-desc">{error}</span>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">
              Start Date <span className="form-required">*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              End Date <span className="form-required">*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="alert alert-info">
            <span className="alert-desc">
              Sessions will be generated based on the class schedule. 
              Existing sessions will be skipped automatically.
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-muted" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                Generating...
              </>
            ) : "Generate Sessions"}
          </button>
        </div>
      </div>
    </div>
  );
}