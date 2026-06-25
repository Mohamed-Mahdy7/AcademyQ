import { createContext, useContext, useState } from "react";
import {
  createGrade,
  getGrades,
  updateGrade,
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

  const findExistingGrade = async (enrollmentId, sessionId, subjectName) => {
    const res = await getGrades(enrollmentId);
    const grades = res.data.results ?? res.data;
    return grades.find(
      (g) => g.session === sessionId && g.subject_name === subjectName
    );
  };

  const editGrade = async (gradeId, payload) => {
    const res = await updateGrade(gradeId, payload);
    return res.data;
  };

  const addGrade = async (payload) => {
    try {
      const res = await createGrade(payload);
      return { data: res.data, isDuplicate: false };
    } catch (error) {
      const fields = error.response?.data?.fields;
      const detail = error.response?.data?.detail || "";
      const isDuplicate =
        fields?.non_field_errors?.some(m => m.includes("unique set")) ||
        detail.includes("unique set");
      if (isDuplicate) {
        return { isDuplicate: true, payload };
      }
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
        findExistingGrade,
        editGrade,
      }}
    >
      <Outlet/>
    </GradeContext.Provider>
  );
};

export const useGrades = () => useContext(GradeContext);