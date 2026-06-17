import api from "../api";

export const getNotificationsRequest = (params) =>
    api.get("api/notifications/", { params });

export const getNotificationRequest = (id) =>
    api.get(`api/notifications/${id}/`);

export const sendNotificationRequest = (data) =>
    api.post("api/notifications/send/", data);

export const getNotificationStatsRequest = () =>
    api.get("api/notifications/stats/");