import {
  createContext,
  useContext,
  useState,
} from "react";

import {
  createGrade,
  getGrades,
  getGradeSummary,
} 

from "../services/grades";
const GradeContext = createContext();

export const GradeProvider = ({ children }) => {
  const [grades, setGrades] = useState([]);
  const [summary, setSummary] = useState(null);

  const loadGrades = async (enrollmentId) => {
    const data = await getGrades(
      enrollmentId
    );

    setGrades(data);
  };

  const loadSummary = async (
    enrollmentId
  ) => {
    const data = await getGradeSummary(
      enrollmentId
    );

    setSummary(data);
  };

  const addGrade = async (payload) => {
    await createGrade(payload);
  };

  return (
    <GradeContext.Provider
      value={{
        grades,
        summary,
        loadGrades,
        loadSummary,
        addGrade,
      }}
    >
      {children}
    </GradeContext.Provider>
  );
};

export const useGrades = () =>
  useContext(GradeContext);