import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonEn from "./locales/en/common.json";
import commonAr from "./locales/ar/common.json";
import authEn from "./locales/en/auth.json";
import authAr from "./locales/ar/auth.json";

i18n
.use(LanguageDetector)
.use(initReactI18next)
.init({
    resources: {
    en: { common: commonEn, auth: authEn },
    ar: { common: commonAr, auth: authAr },
    },
    fallbackLng: "ar", // Arabic-first: if detection fails, default to Arabic, not English
    defaultNS: "common",
    ns: ["common", "auth"],
    interpolation: { escapeValue: false },
    detection: {
    order: ["localStorage", "navigator"],
    caches: ["localStorage"],
    },
});

export default i18n;