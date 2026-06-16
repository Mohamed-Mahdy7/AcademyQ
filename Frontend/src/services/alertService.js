import api from "../api";

export const getAlertsRequest = (params = {}) => {
    const query = new URLSearchParams();
    if (params.risk_level && params.risk_level !== "all") query.set("risk_level", params.risk_level);
    if (params.reviewed !== undefined) query.set("reviewed", params.reviewed);
    return api.get(`/api/alerts/?${query.toString()}`);
};

export const getAlertRequest = (id) =>
    api.get(`/api/alerts/${id}/`);

export const patchAlertRequest = (id, data) =>
    api.patch(`/api/alerts/${id}/`, data);

export const generateMessageRequest = (id) =>
    api.post(`/api/alerts/${id}/generate-message/`);