import api from "../api";

export const getUsersRequest = () =>
    api.get("api/users/");

export const CreateUserRequest = (data) =>
    api.post("api/users/", data);

export const getUserRequest = (id) =>
    api.get(`api/users/${id}`)

export const updateUserRequest = (id, data) =>
    api.put(`api/users/${id}`, data)

export const deleteUserRequest = (id) =>
    api.delete(`api/users/${id}`)

export const createStuedetRequest = (data) =>
    api.post("/api/auth/users/register/student/", data)

export const updateStudentRequest = (id, data) =>
    api.put(`api/auth/users/students/profile/${id}/`, data)
