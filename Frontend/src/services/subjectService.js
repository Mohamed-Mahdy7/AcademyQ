import api from "../api";

export const getSubjects = () => {
    return api.get("/api/subjects/");
}