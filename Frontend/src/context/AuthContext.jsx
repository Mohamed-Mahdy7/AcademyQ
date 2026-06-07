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
            console.log(response.data);
        } catch (error) {
            console.log(error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }


    async function register(data) {
        console.log(data);
        try {
            await registerRequest(data);
            return true;
        } catch (error) {
            console.error(error.response?.data)
            return false;
        }
    }

    async function registerStudent(data) {
        console.log(data);
        try {
            await studentRegisterRequest(data);
            return true;
        } catch (error) {
            console.error(error.response?.data)
            return false;
        }
    }

    async function login(email, password) {
        try {
            await loginRequest({email, password});
            await checkAuth();
            return true;
        } catch (error) {
            console.error(error);
            return false
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