import axios from "axios";
import {toast} from "./lib/toastBus"

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/",
    withCredentials: true,
});

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
                toast.danger("Permission denied", detail);
                // if (status === 401) window.location.href = "/login";
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

export default api;
