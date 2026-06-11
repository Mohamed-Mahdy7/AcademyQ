import api from "../api";

export const getSubjects = () => {
    return api.get("/api/subjects/");
};

export const getSubject = (id) => {
    return api.get(`/api/subjects/${id}/`);
};

export const createSubject = (data) => {
    return api.post("/api/subjects/", data);

    
};

export const updateSubject = (id, data) => {
    return api.put(`/api/subjects/${id}/`, data);
};

export const deleteSubject = (id) => {
    return api.delete(`/api/subjects/${id}/`);
}; 