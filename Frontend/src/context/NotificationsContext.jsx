import { createContext, useState } from "react";
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
            console.error(error);
            setNotifications([]);
            return null;
        }
    }

    async function getNotification(id) {
        try {
            const response = await getNotificationRequest(id);
            setNotification(response.data);
            return response.data;
        } catch (error) {
            console.error(error);
            setNotification(null);
            return null;
        }
    }

    async function sendAlertNotification(alert_id, message = null) {
        setSending(true);
        try {
            const response = await sendAlertNotificationRequest(alert_id, message);
            await getNotifications();
            if (response.data.success) {
                toast.success("Message sent", "The parent has been notified via email.");
            } else {
                toast.warning("Message not delivered", "The email could not be delivered. Check the parent email address.");
            }
            return { success: response.data.success, data: response.data };
        } catch (error) {
            console.error(error.response?.data);
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
                "Reminders processed",
                `Sent: ${sent ?? 0} · Failed: ${failed ?? 0} · Skipped: ${skipped ?? 0}`
            );
            return { success: true, data: response.data };
        } catch (error) {
            console.error(error.response?.data);
            return { success: false, error };
        }
    }

    async function getStats() {
        try {
            const response = await getNotificationStatsRequest();
            setStats(response.data);
            return response.data;
        } catch (error) {
            console.error(error);
            setStats(null);
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