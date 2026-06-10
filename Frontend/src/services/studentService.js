import api from "../api";

export const getStudentsRequest = () => 
    api.get("api/users/students/");

export const createStudentRequest = (data) => 
    api.post("api/auth/users/register/student/", data);

export const updateStudentRequest = (id, data) =>
    api.put(`api/auth/users/students/profile/${id}/`, data);