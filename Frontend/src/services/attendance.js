import api from "../api";

export const getEnrollments = (classId) =>
  api.get(`/api/enrollments/?class_id=${classId}`);

export const getSessionByDate = (classId, date) =>
  api.get(`/api/sessions/?class_id=${classId}&date=${date}`);

export const getSessionAttendance = (sessionId) =>
  api.get(`/api/sessions/${sessionId}/attendance/`);

export const submitAttendance = (sessionId, records) =>
  api.post(`/api/sessions/${sessionId}/attendance/`, { records });

export const createSession = (classId, sessionDate, notes) =>
  api.post(`/api/sessions/`, { class_id: classId, session_date: sessionDate, notes });