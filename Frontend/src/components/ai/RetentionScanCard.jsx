import { useEffect, useState } from "react";
import api from "../../api";

export default function RetentionScanCard() {
  const [lastScan, setLastScan] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/api/agent/scans/")
      .then(res => {
        const logs = res.data.results ?? res.data;
        setLastScan(logs[0] ?? null);
      })
      .catch(() => setLastScan(null));
  }, []);

  const handleRunScan = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await api.post("/api/agent/run-scan/");
      setLastScan(res.data);
    } catch (err) {
      if (err.response?.status === 429) {
        setError("Daily scan limit reached (3/day). Try again tomorrow.");
      } else {
        setError("Scan failed. Please try again.");
      }
    } finally {
      setRunning(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric", month: "short"
    });
  };

  const nextSunday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 7 : 7 - day;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-2">
        <p className="kpi-label">RETENTION SCAN</p>
        <svg className="w-5 h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>

      <p className="text-base font-semibold text-navy mb-1">Weekly Agent Scan</p>

      <p className="text-caption">
        Last run: {formatDate(lastScan?.started_at)}
      </p>
      <p className="text-caption mb-4">
        Next: {nextSunday()}
      </p>

      {error && (
        <p className="text-sm text-danger mb-2">{error}</p>
      )}

      <button
        className="btn-primary w-full"
        onClick={handleRunScan}
        disabled={running}
      >
        {running ? "Scanning..." : "▷ Run Scan Now"}
      </button>
    </div>
  );
}