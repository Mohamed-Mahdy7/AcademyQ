import api from "../api";

export const getClasses = () => api.get("/api/classes/");
export const getClass = (id) => api.get(`/api/classes/${id}/`);
export const createClass = (data) => api.post("/api/classes/", data);
export const updateClass = (id, data) => api.put(`/api/classes/${id}/`, data);
export const deleteClass = (id) => api.delete(`/api/classes/${id}/`);
export const getClassEnrollments = (classId) => api.get(`/api/enrollments/?class_id=${classId}`);
export const getClassSessions = (classId) => api.get(`/api/sessions/?class_id=${classId}`);
export const assignTeacher = (classId, teacherId) =>
    api.post(`/api/classes/${classId}/assign_teacher/`, { teacher_id: teacherId });
export const removeTeacher = (classId, teacherId) =>
    api.delete(`/api/classes/${classId}/remove_teacher/`, { data: { teacher_id: teacherId } });

export const getClassSchedule = (classId) =>
    api.get(`/api/class-schedule/?class_id=${classId}`);
export const addScheduleSlot = (data) =>
    api.post(`/api/class-schedule/`, data);
export const deleteScheduleSlot = (slotId) =>
    api.delete(`/api/class-schedule/${slotId}/`);