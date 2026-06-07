import api from "../api"

export const getTeachers = (search = "") =>
  api.get(`/api/teachers/?search=${search}`);

export const getTeacherById = (teacherId) =>
  api.get(`/api/teachers/${teacherId}/`);

export const createTeacher = (teacherData) =>
  api.post(`/api/teachers/`, teacherData);

export const updateTeacher = (teacherId, teacherData) =>
  api.patch(`/api/teachers/${teacherId}/`, teacherData);

export const deleteTeacher = (teacherId) =>
  api.delete(`/api/teachers/${teacherId}/`);