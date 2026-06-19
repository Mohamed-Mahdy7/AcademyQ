import { createContext, useState } from "react";
import {
    getNotificationsRequest,
    getNotificationRequest,
    sendAlertNotificationRequest,
    sendRemindersRequest,
    getNotificationStatsRequest,
} from "../services/notificationsService";

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
            // Refresh notification list so history updates immediately
            await getNotifications();
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