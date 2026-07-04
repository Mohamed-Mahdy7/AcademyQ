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
    const { data: students = [], isLoading: studentLoading } = useQuery({
        queryKey: ["students"],
        queryFn: async () =>{
            console.log("Fetching students...");
            const res = await getStudentsRequest();
            return res.data;
        } 
    })

    async function getStudent(id) {
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

    const createMutation = useMutation({
        mutationFn: createStudentRequest,
        onSuccess: () => {
            console.log("Mutation success");
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
            const response = await createMutation.mutateAsync( data );
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

    return (
        <StudentContext.Provider
            value={{
                students,
                studentLoading,
                getStudent,
                createStudent,
                updateStudent,
            }}
        >
            { children }
        </StudentContext.Provider>
    );

}

