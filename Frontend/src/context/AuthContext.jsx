import { createContext, useEffect, useState } from "react";
import { 
    registerRequest,
    loginRequest,
    studentRegisterRequest,
    meRequest,
    logoutRequest
} from "../services/authService";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function checkAuth() {
        try{
            const response = await meRequest();
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }


    async function register(data) {
        try {
            await registerRequest(data);
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }

    async function registerStudent(data) {
        console.log(data);
        try {
            await studentRegisterRequest(data);
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }

    async function login(email, password) {
        try {
            await loginRequest({email, password});
            await checkAuth();
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }

    async function logout() {
        try{
            await logoutRequest();
        } finally {
            setUser(null);
        }
    }

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider
        value={{
            user,
            loading,
            register,
            registerStudent,
            login,
            logout,
            isAuthenticated: !!user,
        }}
        >
            {children}
        </AuthContext.Provider>
    )
}