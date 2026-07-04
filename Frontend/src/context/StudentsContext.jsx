import { createContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createStudentRequest,
    updateStudentRequest,
    getStudentsRequest,
    getStudentRequest
} from "../services/studentService";
import { Outlet } from "react-router-dom";

export const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
    const queryClient = useQueryClient();
    // const [students, setStudents] = useState([]);
    // const [student, setStudent] = useState(null);
    const { data: students = [], isLoading: studentLoading } = useQuery({
        queryKey: ["students"],
        queryFn: () => getStudentsRequest().then(r => r.data ),
        staleTime: 0,
    })

    // async function getStudents() {
    //     try {
    //         const response = await getStudentsRequest();
    //         setStudents(response.data);
    //         return response.data;
    //     } catch (error) {
    //         console.error(error);
    //         setStudents([]);
    //         return null;
    //     }
    // }

    // async function getStudent(id) {
    //     try {
    //         const response = await getStudentRequest(id);
    //         setStudent(response.data);
    //         console.log("STUDENT FROM CONTEXT: ", response.data)

    //         return {
    //             success: true,
    //             data: response.data,
    //         };
    //     } catch (error) {
    //         console.error(error);

    //         return {
    //             success: false,
    //             error,
    //         };
    //     }
    // }

    await function getStudent(id) {
        try {
            const data = await queryClient.fetchQuery({
                queryKey: ["student", id],
                queryFn: () => getStudentRequest(id).then(r => r.data),
                staleTime: 1000 * 60,
            });
            return { success: true, data };
        } catch (error) {
            return { success: false, error};
        }
    }

    // async function createStudent(data) {
    //     try {
    //         console.log(`DATA SENT: `, data);
    //         const response = await createStudentRequest(data);
    //         setStudent(response.data);
    //         await getStudents();
    //         return {
    //             success: true,
    //             data: response.data,
    //         };
    //     } catch (error) {
    //         console.error(error);
    //         console.log(error.response?.data);
    //         return {
    //             success: false,
    //             error,
    //         };
    //     }
    // }

    const createMutation = useMutation({
        mutationFn: createStudentRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateStudentRequest(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["student", id] });
        },
    });

    async function createStudent(data) {
        try {
            const response = await createMutation.mutateAsync({ data });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error};
        }
    }

    async function updateStudent(id, data) {
        try {
            const response = await updateMutation.mutateAsync({ id, data });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error};
        }
    }

    // async function updateStudent(id, data = null) {
    //     try {
    //         const response = await updateStudentRequest(id, data);
    //         setStudent(response.data);

    //         return {
    //             success: true,
    //             data: response.data,
    //         };
    //     } catch (error) {
    //         console.error(error.response?.data);
    //         return {
    //             success: false,
    //             error,
    //         };
    //     }
    // }

    // useEffect(() => {
    //     getStudents();
    // }, []);

    return (
        <StudentContext.Provider
            value={{
                // student,
                students,
                studentLoading,
                getStudent,
                // getStudents,
                createStudent,
                updateStudent,
            }}
        >
            { children }
        </StudentContext.Provider>
    );

}

