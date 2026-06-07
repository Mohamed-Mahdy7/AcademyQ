import api from "../api";

export const registerRequest = (data) => 
    api.post("/api/auth/register/", data);

export const studentRegisterRequest = (data) =>
    api.post("/api/auth/users/register-student/", data);

export const loginRequest = (data) =>
    api.post("/api/auth/login/", data);

export const refreshTokenRequest = (data) => 
    api.post("/api/auth/token/refresh/", data);

export const logoutRequest = () =>
    api.post("/api/auth/logout/");