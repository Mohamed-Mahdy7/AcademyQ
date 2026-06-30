import { useTranslation } from "react-i18next";
import { useContext } from "react";
import { AlertContext } from "../context/AlertContext"; // adjust path if needed
import api from "../api";

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const alertCtx = useContext(AlertContext);

    async function toggle() {
        const newLang = i18n.language === "ar" ? "en" : "ar";
        await i18n.changeLanguage(newLang);
        try {
            await api.post("/api/alerts/retranslate-alerts/");
            if (alertCtx) await alertCtx.fetchAlerts();
        } catch {
            // silent fail
        }
    }

    return (
        <button onClick={toggle} className="topbar-icon-btn" aria-label="Toggle language">
            <span className="text-xs font-semibold">{i18n.language === "ar" ? "EN" : "AR"}</span>
        </button>
    );
}