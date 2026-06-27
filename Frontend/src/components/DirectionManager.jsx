import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const RTL_LANGUAGES = ["ar"];

export default function DirectionManager({ children }) {
    const { i18n } = useTranslation();

    useEffect(() => {
        const isRtl = RTL_LANGUAGES.includes(i18n.language);
        document.documentElement.dir = isRtl ? "rtl" : "ltr";
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return children;
}