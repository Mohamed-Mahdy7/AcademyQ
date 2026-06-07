import api from "../api";

export const getAcademyRequest = () =>
    api.get("/api/auth/academy/");

export const updateAcademyRequest = (data) =>
    api.put("/api/auth/academy/", data);

