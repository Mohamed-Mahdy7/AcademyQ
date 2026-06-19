import api from "../api";

export const getAlertsRequest = (params = {}) => {
    const query = new URLSearchParams();
    if (params.risk_level && params.risk_level !== "all") query.set("risk_level", params.risk_level);
    if (params.is_dismissed !== undefined) query.set("is_dismissed", params.is_dismissed);
    return api.get(`/api/alerts/?${query.toString()}`);
};

export const getAlertRequest = (id) =>
    api.get(`/api/alerts/${id}/`);

export const patchAlertRequest = (id, data) =>
    api.patch(`/api/alerts/${id}/`, data);

export const generateMessageRequest = (id) =>
    api.post(`/api/alerts/${id}/generate-message/`);