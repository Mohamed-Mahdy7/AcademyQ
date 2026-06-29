import { createContext, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    getNotificationsRequest,
    getNotificationRequest,
    sendAlertNotificationRequest,
    sendRemindersRequest,
    getNotificationStatsRequest,
} from "../services/notificationsService";
import { toast } from "../lib/toastBus";

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
    const { t } = useTranslation("alerts");
    const [notifications, setNotifications] = useState([]);
    const [notification, setNotification]   = useState(null);
    const [stats, setStats]                 = useState(null);
    const [sending, setSending]             = useState(false);

    async function getNotifications(params = {}) {
        try {
            const response = await getNotificationsRequest(params);
            setNotifications(response.data);
            return response.data;
        } catch (error) {
            setNotifications([]);
            toast.danger(t("toast.fetch_notif_failed"), t("toast.fetch_notif_failed_desc"));
            return null;
        }
    }

    async function getNotification(id) {
        try {
            const response = await getNotificationRequest(id);
            setNotification(response.data);
            return response.data;
        } catch (error) {
            setNotification(null);
            toast.danger(t("toast.fetch_notif_detail_failed"), t("toast.fetch_notif_detail_failed_desc"));
            return null;
        }
    }

    async function sendAlertNotification(alert_id, message = null) {
        setSending(true);
        try {
            const response = await sendAlertNotificationRequest(alert_id, message);
            await getNotifications();
            if (response.data.success) {
                toast.success(t("toast.send_success"), t("toast.send_success_desc"));
            } else {
                toast.warning(t("toast.send_warning"), t("toast.send_warning_desc"));
            }
            return { success: response.data.success, data: response.data };
        } catch (error) {
            toast.danger(t("toast.send_failed"), t("toast.send_failed_desc"));
            return { success: false, error };
        } finally {
            setSending(false);
        }
    }

    async function sendReminders() {
        try {
            const response = await sendRemindersRequest();
            const { sent, failed, skipped } = response.data.results ?? {};
            toast.success(
                t("toast.reminders_processed"),
                t("toast.reminders_processed_desc", { sent: sent ?? 0, failed: failed ?? 0, skipped: skipped ?? 0 })
            );
            return { success: true, data: response.data };
        } catch (error) {
            toast.danger(t("toast.reminders_failed"), t("toast.reminders_failed_desc"));
            return { success: false, error };
        }
    }

    async function getStats() {
        try {
            const response = await getNotificationStatsRequest();
            setStats(response.data);
            return response.data;
        } catch (error) {
            setStats(null);
            toast.danger(t("toast.fetch_stats_failed"), t("toast.fetch_stats_failed_desc"));
            return null;
        }
    }

    return (
        <NotificationsContext.Provider
            value={{
                notifications,
                notification,
                stats,
                sending,
                getNotifications,
                getNotification,
                sendAlertNotification,
                sendReminders,
                getStats,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
};