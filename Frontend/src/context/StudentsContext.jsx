import { createContext, useEffect, useState } from "react";
import { createStuedetRequest, updateStudentRequest } from "../services/studentService";

export const StudentContext = createContext();

const StudentProvider = ({children}) => {
    const [student, setStudent] = useState(null);

    async function createStudent(data) {
        try {
            const response = await createStudentRequest(data);
            setStudent(response.data);

            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                error,
            };
        }
    }

    async function updateStudent(id, data) {
        try {
            const response = await updateStudentRequest(id, data);
            setStudent(response.data);

            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            console.error(error);
            return {
                success: false,
                error,
            };
        }
    }

    return (
        <StudentContext.Provider
            value={{
                student,
                createStudent,
                updateStudent,
            }}
        >
            {children}
        </StudentContext.Provider>
    );

}

export default StudentProvider