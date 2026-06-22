import { createContext, useContext, useEffect, useState } from "react";
import { getAlertsRequest, patchAlertRequest, generateMessageRequest,} from "../services/alertService";

export const AlertContext = createContext();

export function AlertProvider({ children }) {
    const [alerts, setAlerts]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [filter, setFilter] = useState({ risk_level: "all", is_dismissed: "false" });
    const [expandedId, setExpandedId] = useState(null);
    const [generatingId, setGeneratingId] = useState(null);

    async function fetchAlerts(overrideFilter) {
        setLoading(true);
        setError(null);
        try {
            const params = overrideFilter ?? filter;
            const response = await getAlertsRequest(params);
            setAlerts(response.data);
        } catch (err) {
            console.error(err.response?.data);
            setError("Failed to load alerts.");
        } finally {
            setLoading(false);
        }
    }

    async function dismissAlert(id) {
        try {
            await patchAlertRequest(id, { is_dismissed: true });   // was { reviewed: true }
            setAlerts((prev) => prev.filter((a) => a.id !== id));
            if (expandedId === id) setExpandedId(null);
        } catch (err) {
            console.error(err.response?.data);
        }
    }

    async function updateNotes(id, notes) {
        try {
            const response = await patchAlertRequest(id, { notes });
            setAlerts((prev) =>
                prev.map((a) => (a.id === id ? { ...a, notes: response.data.notes } : a))
            );
            return true;
        } catch (err) {
            console.error(err.response?.data);
            return false;
        }
    }

    async function generateMessage(id) {
        setGeneratingId(id);
        try {
            const response = await generateMessageRequest(id);
            const message = response.data.message;
            setAlerts((prev) =>
                prev.map((a) => (a.id === id ? { ...a, message } : a))
            );
            return message;
        } catch (err) {
            console.error(err.response?.data);
            return null;
        } finally {
            setGeneratingId(null);
        }
    }

    function updateLocalMessage(id, message) {
        setAlerts((prev) =>
            prev.map((a) => (a.id === id ? { ...a, message } : a))
        );
    }

    function toggleExpand(id) {
        setExpandedId((prev) => (prev === id ? null : id));
    }

    function applyFilter(newFilter) {
        setFilter(newFilter);
        fetchAlerts(newFilter);
    }

    useEffect(() => {
        fetchAlerts();
    }, []);

    const highCount   = alerts.filter((a) => a.risk_level === "high").length;
    const mediumCount = alerts.filter((a) => a.risk_level === "medium").length;
    const lowCount    = alerts.filter((a) => a.risk_level === "low").length;

    return (
        <AlertContext.Provider
            value={{
                alerts,
                loading,
                error,
                filter,
                expandedId,
                generatingId,
                highCount,
                mediumCount,
                lowCount,
                fetchAlerts,
                applyFilter,
                toggleExpand,
                dismissAlert,
                updateNotes,
                generateMessage,
                updateLocalMessage,
            }}
        >
            {children}
        </AlertContext.Provider>
    );
}

export function useAlerts() {
    const ctx = useContext(AlertContext);
    if (!ctx) throw new Error("useAlerts must be used inside AlertProvider");
    return ctx;
}