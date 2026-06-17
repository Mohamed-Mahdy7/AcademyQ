import api from "../api";

export const getReports = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/api/reports/${query ? `?${query}` : ""}`);
};

export const getReport = (reportId) =>
    api.get(`/api/reports/${reportId}/`);

export const generateReport = (enrollmentId, month) =>
    api.post("/api/reports/generate/", {
        enrollment_id: enrollmentId,
        month,
    });