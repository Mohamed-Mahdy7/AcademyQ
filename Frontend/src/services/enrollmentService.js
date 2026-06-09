import api from "../api";

export const getEnrollments = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/api/enrollments/?${params}`);
};

export const getEnrollmentById = (id) =>
  api.get(`/api/enrollments/${id}/`);

export const createEnrollment = (data) =>
  api.post(`/api/enrollments/`, data);

export const updateEnrollment = (id, data) =>
  api.patch(`/api/enrollments/${id}/`, data);

export const deleteEnrollment = (id) =>
  api.delete(`/api/enrollments/${id}/`);