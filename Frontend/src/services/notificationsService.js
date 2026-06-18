import api from "../api";

export const getNotificationsRequest = (params) =>
    api.get("/api/notifications/", { params });

export const getNotificationRequest = (id) =>
    api.get(`/api/notifications/${id}/`);

export const sendAlertNotificationRequest = (alert_id, message = null) =>
    api.post("/api/notifications/send-alert/", { 
        alert_id,
        ...(message && { message }),
    });

export const sendRemindersRequest = () =>
    api.post("/api/notifications/send-reminders/");

export const getNotificationStatsRequest = () =>
    api.get("/api/notifications/stats/");