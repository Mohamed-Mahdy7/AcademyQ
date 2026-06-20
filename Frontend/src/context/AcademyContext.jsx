import { createContext, useEffect, useState } from "react";
import { getAcademyRequest, updateAcademyRequest } from "../services/academyService";

export const AcademyContext = createContext();

export function AcademyProvider({  children }) {
    const [academy, setAcademy] = useState(null)

    async function getAcademy() {
        try{
            const response = await getAcademyRequest();
            setAcademy(response.data);
            return response.data;
        } catch (error) {
            console.error(error)
            setAcademy(null);
            return null;
        }
    }

    async function updateAcademy(data) {
        try{
            console.log("DATA:", data)
            const response = await updateAcademyRequest(data);
            setAcademy(response.data);

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error(error)
            return {
                success: false,
                error,
            };
        }
    }

    useEffect(() => {
        getAcademy();
    }, []);

    return (
        <AcademyContext.Provider
            value={{
                academy,
                getAcademy,
                updateAcademy,
            }}
        >
            {children}
        </AcademyContext.Provider>
    );
}