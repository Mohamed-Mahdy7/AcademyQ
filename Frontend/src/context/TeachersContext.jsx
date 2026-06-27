import {getTeachers,getTeacherById,createTeacher,updateTeacher,deleteTeacher,} from "../services/teachers";
import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "../lib/toastBus";

export const teacherContext = createContext();

export function TeacherProvider({ children }) {
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
      setError("Failed to load teachers.");
      toast.danger("Failed to load teachers", "Could not fetch teacher list.");
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
      setError("Failed to load teacher.");
      toast.danger("Failed to load teacher", "Could not fetch teacher details.");
      return { success: false };
    } finally {
      setLoading(false);
    }
  }

  async function addTeacher(data) {
    try {
      await createTeacher(data);
      await listTeachers();
      toast.success("Teacher added", "Teacher profile created successfully.");
      return { success: true };
    } catch (error) {
      const fields = error.response?.data?.fields;
      const detail = error.response?.data?.detail;
      const nonFieldError = fields?.non_field_errors?.[0];
      if (nonFieldError) toast.danger("Could not add teacher", nonFieldError);
      return { success: false, errors: fields ?? (detail ? { detail } : {}) };
    }
  }

  async function editTeacher(id, data) {
    try {
      await updateTeacher(id, data);
      await listTeachers();
      toast.success("Teacher updated", "Changes saved successfully.");
      return { success: true };
    } catch (error) {
      const fields = error.response?.data?.fields;
      const detail = error.response?.data?.detail;
      const nonFieldError = fields?.non_field_errors?.[0];
      if (nonFieldError) toast.danger("Could not update teacher", nonFieldError);
      return { success: false, errors: fields ?? (detail ? { detail } : {}) };
    }
  }

  async function removeTeacher(id) {
    try {
        await deleteTeacher(id);
        await listTeachers(); 
        toast.success("Teacher deactivated", "The teacher's account has been deactivated.");
        return { success: true };
    } catch (error) {
        toast.danger("Could not deactivate", "Failed to deactivate the teacher account.");
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