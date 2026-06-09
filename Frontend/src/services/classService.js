import api from "../api";

export const getClasses = () => api.get("/api/classes/");
export const getClass = (id) => api.get(`/api/classes/${id}/`);
export const createClass = (data) => api.post("/api/classes/", data);
export const updateClass = (id, data) => api.put(`/api/classes/${id}/`, data);
export const deleteClass = (id) => api.delete(`/api/classes/${id}/`);