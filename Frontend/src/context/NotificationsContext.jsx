import { createContext, useState } from "react";
import {
    getNotificationsRequest,
    getNotificationRequest,
    sendNotificationRequest,
    getNotificationStatsRequest,
} from "../services/notificationsService";

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [notification, setNotification] = useState(null);
    const [stats, setStats] = useState(null);

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

    async function sendNotification(data) {
        try {
            const response = await sendNotificationRequest(data);
            await getNotifications();
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
                getNotifications,
                getNotification,
                sendNotification,
                getStats,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
};