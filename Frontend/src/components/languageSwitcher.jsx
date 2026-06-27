import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    function toggle() {
        i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
    }

    return (
        <button onClick={toggle} className="topbar-icon-btn" aria-label="Toggle language">
        <span className="text-xs font-semibold">{i18n.language === "ar" ? "EN" : "AR"}</span>
        </button>
    );
}