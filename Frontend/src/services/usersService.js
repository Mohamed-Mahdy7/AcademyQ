import api from "../api";

export const getUsersRequest = () =>
    api.get("api/users/");

export const createUserRequest = (data) =>
    api.post("api/users/", data);

export const getUserRequest = (id) =>
    api.get(`api/users/${id}`)

export const updateUserRequest = (id, data) =>
    api.put(`api/users/${id}`, data)

export const deleteUserRequest = (id) =>
    api.delete(`api/users/${id}`)
