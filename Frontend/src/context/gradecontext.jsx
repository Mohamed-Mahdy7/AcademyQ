import { createContext, useContext, useState } from "react";
import {
  createGrade,
  getGrades,
  getGradeSummary,
  getClassSummary,
} from "../services/gradesService";
import { Outlet } from "react-router-dom";

const GradeContext = createContext();

export const GradeProvider = ({ children }) => {
  const [grades, setGrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadGrades = async (enrollmentId) => {
    if (!enrollmentId) return;
    setLoading(true);
    try {
      const res = await getGrades(enrollmentId);
      setGrades(res.data.results ?? res.data);
    } catch (error) {
      console.error("loadGrades error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (enrollmentId) => {
    if (!enrollmentId) return;
    try {
      const res = await getGradeSummary(enrollmentId);
      setSummary(res.data);
    } catch (error) {
      console.error("loadSummary error:", error);
    }
  };

  const addGrade = async (payload) => {
    try {
      const res = await createGrade(payload);
      return res.data;
    } catch (error) {
      console.error("addGrade error:", error);
      throw error;
    }
  };

  return (
    <GradeContext.Provider
      value={{
        grades,
        summary,
        loading,
        loadGrades,
        loadSummary,
        addGrade,
      }}
    >
      <Outlet/>
    </GradeContext.Provider>
  );
};

export const useGrades = () => useContext(GradeContext);