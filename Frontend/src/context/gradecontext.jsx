import { createContext, useContext, useState } from "react";
import {
  createGrade,
  getGrades,
  getGradeSummary,
  getGradeHistory,
} from "../services/grades";

const GradeContext = createContext();

export const GradeProvider = ({ children }) => {
  const [grades, setGrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setloading] =useState(true)

  const loadGrades = async (enrollmentId) => {
    if (!enrollmentId) return;

    const res = await getGrades(enrollmentId);
    setGrades(res.data || []);
  };

  const loadSummary = async (enrollmentId) => {
    if (!enrollmentId) return;

    const res = await getGradeSummary(enrollmentId);
    setSummary(res.data || null);
  };

   const loadHistory = async (enrollmentId) => {
   

  const res = await getGradeHistory(enrollmentId);
  setHistory(res.data || null);
  return res.data;    
};

   const addGrade = async (payload) => {
  try {
    const res = await createGrade(payload);
    return res.data;
  } catch (error) {
     console.log("STATUS:", error.response?.status);
  console.log("DATA:", error.response?.data);
  console.log("HEADERS:", error.response?.headers);
    console.error("addGrade error:", error);
    throw error;
  }
};

  return (
    <GradeContext.Provider
      value={{
        grades,
        summary,
        history,
        loadGrades,
        loadSummary,
        loadHistory,
        addGrade,
      }}
    >
      {children}
    </GradeContext.Provider>
  );
};

export const useGrades = () => useContext(GradeContext);