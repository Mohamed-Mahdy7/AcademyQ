import { createContext, useContext, useState } from "react";
import {getEnrollments, createEnrollment, updateEnrollment, deleteEnrollment,} from "../services/enrollmentService";
import { toast } from "../lib/toastBus";
import { useTranslation } from "react-i18next";

export const EnrollmentContext = createContext();

export function EnrollmentProvider({ children }) {
  const { t } = useTranslation("enrollment");
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
      toast.success(t("messages.enroll_success"), t("messages.enroll_success_desc"));
      return { success: true, data: res.data };
    } catch (err) {
      const fields = err.response?.data?.fields;
      const detail = err.response?.data?.detail;
      const nonFieldError = fields?.non_field_errors?.[0];

      if (nonFieldError) {
        toast.danger(t("messages.enroll_failed"), nonFieldError);
      } else if (detail && detail !== "Please fix the highlighted fields.") {
        toast.danger(t("messages.enroll_failed"), detail);
      }

      return { success: false, errors: fields ?? (detail ? { detail } : {}) };
    }
  }

  async function editEnrollment(id, data) {
    try {
      await updateEnrollment(id, data);
      toast.success(t("messages.update_success"), t("messages.update_success_desc"));
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
      toast.success(t("messages.drop_success"), t("messages.drop_success_desc"));
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