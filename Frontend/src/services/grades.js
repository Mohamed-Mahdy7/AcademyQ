import api from "../api.js";

export const createGrade = (data) => 
   api.post("api/grades/", data);
  
;

export const getGrades =  (enrollmentId) => 
  api.get(`api/grades/?enrollment_id=${enrollmentId}`);

  
;
export const listGrade = () => 
   api.get("api/grades/");
    
;
 export const getGradeSummary =  (enrollmentId) => 
      api.get("api/grades/summary/", {
    params: { enrollment_id: enrollmentId },
  });
 


export const getGradeHistory =  (enrollmentId) => 
   api.get("api/grades/history/", {
    params: { enrollment_id: enrollmentId },
  });
  
export const updateGrade =  (id, data) =>
     api.patch(`api/grades/${id}/`,data);

export const deleteGrade =  (id) =>
    api.delete(`api/grades/${id}/`);