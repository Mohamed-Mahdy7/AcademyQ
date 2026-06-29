import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonEn from "./locales/en/common.json";
import commonAr from "./locales/ar/common.json";
import authEn from "./locales/en/auth.json";
import authAr from "./locales/ar/auth.json";
import attendanceEn from "./locales/en/attendance.json";
import attendanceAr from "./locales/ar/attendance.json";
import studentsAr from "./locales/ar/students.json"
import studentsEn from "./locales/en/students.json"
import gradesEn from "./locales/en/grades.json";
import gradesAr from "./locales/ar/grades.json";
import alertsEn from "./locales/en/alerts.json";
import alertsAr from "./locales/ar/alerts.json";
import layoutEn from "./locales/en/layout.json"
import layoutAr from "./locales/ar/layout.json"
import subjectsEn from "./locales/en/subjects.json";
import subjectsAr from "./locales/ar/subjects.json";
import classesEn from "./locales/en/classes.json";
import classesAr from "./locales/ar/classes.json";
import dashboardEn from "./locales/en/dashboard.json" 
import dashboardAr from "./locales/ar/dashboard.json"
import teacherEn from "./locales/en/teacher.json"
import teacherAr from "./locales/ar/teacher.json"
import enrollmentEn from "./locales/en/enrollment.json"
import enrollmentAr from "./locales/ar/enrollment.json"
import notificationEn from "./locales/en/notification.json"
import notificationAr from "./locales/ar/notification.json"
import paymentEn from "./locales/en/payment.json"
import paymentAr from "./locales/ar/payment.json"
import reportsEn from "./locales/en/reports.json";
import reportsAr from "./locales/ar/reports.json";


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
            subjects: subjectsEn,
            classes: classesEn,
            dashboard: dashboardEn,
            teacher: teacherEn,
            enrollment: enrollmentEn,
            notification: notificationEn,
            payment: paymentEn,
            reports: reportsEn,
        },
        ar: { 
            common: commonAr,
            auth: authAr,
            students: studentsAr,
            dashboard: dashboardAr,
            attendance: attendanceAr,
            grades: gradesAr,
            alerts: alertsAr,
            layout: layoutAr,
            subjects: subjectsAr,
            classes: classesAr,
            teacher: teacherAr,
            enrollment: enrollmentAr,
            notification: notificationAr,
            payment: paymentAr,
            reports: reportsAr,
        },

    },
    fallbackLng: "ar", // Arabic-first: if detection fails, default to Arabic, not English
    defaultNS: "common",
    ns: ["common", "auth", "students", "attendance", "grades", "alerts", "layout", "dashboard", "subjects", "classes", "teacher", "enrollment", "notification", "payment", "reports"],
    interpolation: { escapeValue: false },
    detection: {
    order: ["localStorage", "navigator"],
    caches: ["localStorage"],
    },
});

export default i18n;