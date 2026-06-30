import {getTeachers,getTeacherById,createTeacher,updateTeacher,deleteTeacher,} from "../services/teachers";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "../lib/toastBus";
import { useTranslation } from "react-i18next";

export const teacherContext = createContext();

export function TeacherProvider({ children }) {
  const { t } = useTranslation("teacher");
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 
  async function listTeachers(search = "") {
    setLoading(true);
    try {
      const response = await getTeachers(search);
      setTeachers(response.data.results ?? response.data);
    } catch (error) {
      setError(t("messages.load_failed"));
      toast.danger(t("messages.load_failed"), t("messages.load_failed_desc"));
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeacherById(id) {
    setLoading(true);
    try {
      const response = await getTeacherById(id);
      setSelectedTeacher(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      setError(t("messages.fetch_failed"));
      toast.danger(t("messages.fetch_failed"), t("messages.fetch_failed_desc"));
      return { success: false };
    } finally {
      setLoading(false);
    }
  }

  async function addTeacher(data) {
    try {
      await createTeacher(data);
      await listTeachers();
      toast.success(t("messages.add_success"), t("messages.add_success_desc"));
      return { success: true };
    } catch (error) {
      const fields = error.response?.data?.fields;
      const detail = error.response?.data?.detail;
      const nonFieldError = fields?.non_field_errors?.[0];
      if (nonFieldError) toast.danger(t("messages.add_failed"), nonFieldError);
      return { success: false, errors: fields ?? (detail ? { detail } : {}) };
    }
  }

  async function editTeacher(id, data) {
    try {
      await updateTeacher(id, data);
      await listTeachers();
      toast.success(t("messages.update_success"), t("messages.update_success_desc"));
      return { success: true };
    } catch (error) {
      const fields = error.response?.data?.fields;
      const detail = error.response?.data?.detail;
      const nonFieldError = fields?.non_field_errors?.[0];
      if (nonFieldError) toast.danger(t("messages.update_failed"), nonFieldError);
      return { success: false, errors: fields ?? (detail ? { detail } : {}) };
    }
  }

  async function removeTeacher(id) {
    try {
        await deleteTeacher(id);
        await listTeachers(); 
        toast.success(t("messages.deactivate_success"), t("messages.deactivate_success_desc"));
        return { success: true };
    } catch (error) {
        toast.danger(t("messages.deactivate_failed"), t("messages.deactivate_failed_desc"));
        return { success: false };
    }
  }

  useEffect(() => {
    listTeachers();
  }, []);

  return (
    <teacherContext.Provider
      value={{
        teachers,
        selectedTeacher,
        loading,
        error,
        listTeachers,
        fetchTeacherById,
        addTeacher,
        editTeacher,
        removeTeacher,
      }}
    >
      {children}
    </teacherContext.Provider>
  );
}

export const useTeacher = () => useContext(teacherContext);