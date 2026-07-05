import { createContext, useEffect, useState } from "react";
import { 
    registerRequest,
    loginRequest,
    studentRegisterRequest,
    meRequest,
    logoutRequest
} from "../services/authService";
import { useTranslation } from "react-i18next";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const { t } = useTranslation("auth")
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function checkAuth() {
        try{
            const response = await meRequest();
            setUser(response.data);
            return response.data;
        } catch (error) {
            setUser(null);
            return null;
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
            const userData = await checkAuth();
            if (!userData) return { success: false, error: { message: t("auth_failed") } };
            // if (!userData.setup_complete) {
            //     return { success: false, error: { message: t("academy_setup_incomplete") } };
            // }
            return { success: true, user: userData };
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