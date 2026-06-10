import { createContext, useEffect, useState } from "react";
import { 
    createStudentRequest, 
    updateStudentRequest,
    getStudentsRequest
} from "../services/studentService";

export const StudentContext = createContext();

export const StudentProvider = ({children}) => {
    const [students, setStudents] = useState([]);
    const [student, setStudent] = useState(null);

    async function getStudents() {
            try{
                const response = await getStudentsRequest();
                setStudents(response.data);
                return response.data;
            } catch (error) {
                console.error(error);
                setStudents([]);
                return null;
            }
        }

    async function createStudent(data) {
        try {
            console.log(`DATA SENT: `, data);
            const response = await createStudentRequest(data);
            setStudent(response.data);

            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            console.error(error);
            console.log(error.response?.data);
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

    useEffect(() => {
        getStudents();
    }, []);

    return (
        <StudentContext.Provider
            value={{
                student,
                students,
                getStudents,
                createStudent,
                updateStudent,
            }}
        >
            {children}
        </StudentContext.Provider>
    );

}

