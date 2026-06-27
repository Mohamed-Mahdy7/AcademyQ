import axios from "axios";
import {toast} from "./lib/toastBus"
import i18n from "./i18n";


const api = axios.create({
    baseURL: "http://127.0.0.1:8000/",
    withCredentials: true,
});

let isRedirectingToLogin = false;

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if(!error.response) {
            toast.danger("Connection problem", "Can't reach the server. Check your connection.")
            return Promise.reject(error);
        }
        const {status, data} = error.response;
        const code = data?.code;
        const detail = data?.detail || "Something went wrong.";

        switch(code) {
            case "validation_error":
                break;

            case "permission_denied":
                if (status === 401) {
                    if (error.config?.skipAuthRedirect) {
                        break; // expected 401 from a routine auth check, not a real session-expiry event
                    }
                    toast.danger("Permission denied", detail);
                    if (!isRedirectingToLogin && window.location.pathname !== "/login") {
                        isRedirectingToLogin = true;
                        toast.danger("Session expired", "Please log in again.");
                        // window.location.href = "/login";
                    }
                } else {
                    toast.danger("Permission denied", detail);
                }
                break;

            case "not_found":
                toast.danger("Not found", detail);
                break;

            case "rate_limited":
                toast.warning("Slow down", detail);
                break;
                
            default:
                toast.danger("Something went wrong", detail);
        }

        return Promise.reject(error);
    }
);

api.interceptors.request.use((config) => {
    config.headers["Accept-Language"] = i18n.language;
    return config;
});

export default api;
