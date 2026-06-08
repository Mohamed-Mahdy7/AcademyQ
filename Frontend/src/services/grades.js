import api from "../api.js";

export const createGrade = (data) => 
   api.post("/grades/", data);
  
;

export const getGrades =  (enrollmentId) => 
  api.get(`/grades/?enrollment_id=${enrollmentId}`);

  
;
export const listGrade = () => 
   api.get("/grades/", data);
    
;
 export const getGradeSummary =  () => 
   api.get(`/grades/summary/?enrollment_id=${enrollmentId}`);
 


export const getGradeHistory =  () => 
  api.get(`/api/grades/history?enrollment_id=${enrollmentId}`);
  
export const updateGrade =  (id, data) =>
     api.patch(`/grades/${id}/`,data);

export const deleteGrade =  (id) =>
    api.delete(`/grades/${id}/`);