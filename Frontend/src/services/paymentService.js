import api from "../api";

export const getPayments = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/api/payments/?${params}`);
};

export const getPaymentsSummary = (month = "") =>
  api.get(`/api/payments/summary/${month ? `?month=${month}` : ""}`);

export const createPayment = (data) =>
  api.post(`/api/payments/`, data);

export const deletePayment = (id) =>
  api.delete(`/api/payments/${id}/`);

export const editPayment = (id, data) =>
  api.patch(`/api/payments/${id}/`, data);

export const updatePayment = (id, data) =>
  api.patch(`/api/payments/${id}/`, data);