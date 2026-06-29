import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAlertsRequest, patchAlertRequest, generateMessageRequest,} from "../services/alertService";
import { toast } from "../lib/toastBus";

export const AlertContext = createContext();

export function AlertProvider({ children }) {
    const { t } = useTranslation("alerts");
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
            setError(t("toast.fetch_failed"));
            toast.danger(t("toast.fetch_failed"), t("toast.fetch_failed_desc"));
        } finally {
            setLoading(false);
        }
    }

    async function dismissAlert(id) {
        try {
            await patchAlertRequest(id, { is_dismissed: true });
            setAlerts((prev) => prev.filter((a) => a.id !== id));
            if (expandedId === id) setExpandedId(null);
            toast.success(t("toast.dismiss_success"), t("toast.dismiss_success_desc"));
        } catch (err) {
            toast.danger(t("toast.dismiss_failed"), t("toast.dismiss_failed_desc"));
        }
    }

    async function updateNotes(id, notes) {
        try {
            const response = await patchAlertRequest(id, { notes });
            setAlerts((prev) =>
                prev.map((a) => (a.id === id ? { ...a, notes: response.data.notes } : a))
            );
            toast.success(t("toast.notes_saved"), t("toast.notes_saved_desc"));
            return true;
        } catch (err) {
            toast.danger(t("toast.notes_failed"), t("toast.notes_failed_desc"));
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
            toast.success(t("toast.generate_success"), t("toast.generate_success_desc"));
            return message;
        } catch (err) {
            toast.danger(t("toast.generate_failed"), t("toast.generate_failed_desc"));
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