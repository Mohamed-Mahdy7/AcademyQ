import {getTeachers,getTeacherById,createTeacher,updateTeacher,deleteTeacher,} from "../services/teachers";
import { createContext, useContext, useEffect, useState } from "react";

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
      console.error(error);
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
      return { success: false };
    } finally {
      setLoading(false);
    }
  }

  async function addTeacher(data) {
    try {
      await createTeacher(data);
      await listTeachers();
      return { success: true };
    } catch (error) {
      return { success: false, errors: error.response?.data || {} };
    }
  }

  async function editTeacher(id, data) {
    try {
      const response = await updateTeacher(id, data);
      console.log("SUCCESS:", response);
      await listTeachers();
      return { success: true };
    } catch (error) {
      console.log("ERROR:", error.response?.data);
      return { success: false, errors: error.response?.data || {} };
    }
  }

  async function removeTeacher(id) {
    try {
      await deleteTeacher(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      return { success: true };
    } catch (error) {
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