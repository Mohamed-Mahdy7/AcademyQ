import { AcademyContext } from "../../context/AcademyContext";
import { useContext, useState, useEffect } from "react";
import FormHeading from "./FormHeading";
import { useTranslation } from "react-i18next";
import { toast } from "../../lib/toastBus";

export default function Notifications() {
    const { t } = useTranslation(["settings", "common"]);
    const { academy, updateAcademy } = useContext(AcademyContext);
    const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (academy) {
            setWeeklyReportEnabled(academy.weekly_report_enabled ?? true);
        }
    }, [academy]);

    async function handleToggle(e) {
        const newValue = e.target.checked;
        setWeeklyReportEnabled(newValue);
        setSaving(true);

        const result = await updateAcademy({
            name: academy.name,
            email: academy.email,
            phone: academy.phone,
            weekly_report_enabled: newValue,
        });

        if (!result.success) {
            setWeeklyReportEnabled(!newValue);
            toast.danger(t("weekly_report_update_failed"));
        } else {
            toast.success(
                newValue ? t("weekly_report_enabled") : t("weekly_report_disabled")
            );
        }

        setSaving(false);
    }

    if (!academy) {
        return <div className="skeleton skeleton-card" />;
    }

    return (
        <>
            <FormHeading
                heading={t("notifications")}
                subheading={t("notifications_desc")}
            />
            <div className="card-body rounded-t-none space-y-6">
                <label className="flex justify-between items-center cursor-pointer">
                    <div>
                        <h3 className="heading-3">{t("weekly_report")}</h3>
                        <p className="subheading">{t("weekly_report_desc")}</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={weeklyReportEnabled}
                        disabled={saving}
                        onChange={handleToggle}
                        className="h-5 w-5"
                    />
                </label>
            </div>
        </>
    );
}