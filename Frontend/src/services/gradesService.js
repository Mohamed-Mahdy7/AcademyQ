import api from "../api.js";

export const createGrade = (data) =>
  api.post("/api/grades/", data);

export const getGrades = (enrollmentId) =>
  api.get(`/api/grades/?enrollment_id=${enrollmentId}`);

export const listGrades = () =>
  api.get("/api/grades/");

export const getGradeSummary = (enrollmentId) =>
  api.get("/api/grades/summary/", {
    params: { enrollment_id: enrollmentId },
  });

export const getClassSummary = (classId) =>
  api.get("/api/grades/class-summary/", {
    params: { class_id: classId },
  });

export const updateGrade = (id, data) =>
  api.patch(`/api/grades/${id}/`, data);

export const deleteGrade = (id) =>
  api.delete(`/api/grades/${id}/`);