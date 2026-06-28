import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonEn from "./locales/en/common.json";
import commonAr from "./locales/ar/common.json";
import authEn from "./locales/en/auth.json";
import authAr from "./locales/ar/auth.json";
import attendanceEn from "./locales/en/attendance.json";
import attendanceAr from "./locales/ar/attendance.json";
import gradesEn from "./locales/en/grades.json";
import gradesAr from "./locales/ar/grades.json";
import alertsEn from "./locales/en/alerts.json";
import alertsAr from "./locales/ar/alerts.json";
import studentsEn from "./locales/en/students.json"
import studentsAr from "./locales/ar/students.json"
import layoutEn from "./locales/en/layout.json"
import layoutAr from "./locales/ar/layout.json"
import dashboardEn from "./locales/en/dashboard.json" 
import dashboardAr from "./locales/ar/dashboard.json"


i18n
.use(LanguageDetector)
.use(initReactI18next)
.init({
    resources: {
        en: { 
            common: commonEn,
            auth: authEn,
            students: studentsEn,
            attendance: attendanceEn,
            grades: gradesEn,
            alerts: alertsEn,
            layout: layoutEn,
            dashboard: dashboardEn,
        },
        ar: { 
            common: commonAr,
            auth: authAr,
            students: studentsAr,
            dashboard: dashboardAr,
            attendance: attendanceAr,
            grades: gradesAr,
            alerts: alertsAr,
            layout: layoutAr
        },

    },
    fallbackLng: "ar", // Arabic-first: if detection fails, default to Arabic, not English
    defaultNS: "common",
    ns: ["common", "auth", "students", "attendance", "grades", "alerts", "layout", "dashboard"],
    interpolation: { escapeValue: false },
    detection: {
    order: ["localStorage", "navigator"],
    caches: ["localStorage"],
    },
});

export default i18n;