import { createContext, useContext, useState } from "react";
import {getEnrollments, createEnrollment, updateEnrollment, deleteEnrollment,} from "../services/enrollmentService";
import { toast } from "../lib/toastBus";

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
      const res = await createEnrollment(data);
      toast.success("Student enrolled", "The student has been enrolled successfully.");
      return { success: true, data: res.data };
    } catch (err) {
      const fields = err.response?.data?.fields;
      const detail = err.response?.data?.detail;
      return { success: false, errors: fields ?? (detail ? { detail } : {}) };
    }
  }

  async function editEnrollment(id, data) {
    try {
      await updateEnrollment(id, data);
      toast.success("Enrollment updated", "The enrollment status has been updated.");
      return { success: true };
    } catch (err) {
      const fields = err.response?.data?.fields;
      const detail = err.response?.data?.detail;
      return { success: false, errors: fields ?? (detail ? { detail } : {}) };
    }
  }

  async function removeEnrollment(id) {
    try {
      await deleteEnrollment(id);
      setEnrollments((prev) => prev.filter((e) => e.id !== id));
      toast.success("Enrollment dropped", "The student's enrollment has been set to dropped.");
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