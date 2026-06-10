import api from "../api.js";

export const createGrade = (data) => 
   api.post("api/grades/", data);
  
;

export const getGrades =  (enrollmentId) => 
  api.get(`/grades/?enrollment_id=${enrollmentId}`);

  
;
export const listGrade = () => 
   api.get("/grades/");
    
;
 export const getGradeSummary =  (enrollmentId) => 
      api.get("/grades/summary/", {
    params: { enrollment_id: enrollmentId },
  });
 


export const getGradeHistory =  (enrollmentId) => 
   api.get("/grades/history/", {
    params: { enrollment_id: enrollmentId },
  });
  
export const updateGrade =  (id, data) =>
     api.patch(`/grades/${id}/`,data);

export const deleteGrade =  (id) =>
    api.delete(`/grades/${id}/`);