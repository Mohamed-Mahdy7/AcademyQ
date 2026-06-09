import { createContext, useContext, useState } from "react";
import {getEnrollments, createEnrollment, updateEnrollment, deleteEnrollment,} from "../services/enrollmentService";

export const EnrollmentContext = createContext();

export function EnrollmentProvider({ children }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function listEnrollments(filters = {}) {
    setLoading(true);
    setError("");
    try {
      const response = await getEnrollments(filters);
      const data = response.data.results ?? response.data;
      setEnrollments(data);
      return data;
    } catch (err) {
      setError("Failed to load enrollments.");
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function addEnrollment(data) {
    try {
      await createEnrollment(data);
      return { success: true };
    } catch (err) {
      return { success: false, errors: err.response?.data || {} };
    }
  }

  async function editEnrollment(id, data) {
    try {
      await updateEnrollment(id, data);
      return { success: true };
    } catch (err) {
      return { success: false, errors: err.response?.data || {} };
    }
  }

  async function removeEnrollment(id) {
    try {
      await deleteEnrollment(id);
      setEnrollments((prev) => prev.filter((e) => e.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }

  return (
    <EnrollmentContext.Provider
      value={{
        enrollments,
        loading,
        error,
        listEnrollments,
        addEnrollment,
        editEnrollment,
        removeEnrollment,
      }}
    >
      {children}
    </EnrollmentContext.Provider>
  );
}

export const useEnrollment = () => useContext(EnrollmentContext);