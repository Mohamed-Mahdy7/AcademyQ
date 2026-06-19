import { AcademyContext } from "../../context/AcademyContext";
import { useContext, useState, useEffect } from "react";
import FormHeading from "./FormHeading";

export default function Notifications() {
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
        setWeeklyReportEnabled(newValue); // optimistic update
        setSaving(true);

        const result = await updateAcademy({ 
            name: academy.name,
            email: academy.email,
            phone: academy.phone,
            weekly_report_enabled: newValue 
        });

        if (!result.success) {
            console.log(result.error?.response?.data)
            setWeeklyReportEnabled(!newValue); // revert on failure
            alert("Failed to update notification settings");
        } else{
            if (weeklyReportEnabled === false) {
                alert("Academy weekly report enabled!")
            } else{
                alert("Academy weekly report disapled!")
            }
        }
        setSaving(false);
    }

    if (!academy) {
        return <p>Loading...</p>;
    }

    return (
        <>
            <FormHeading
                heading="Notifications"
                subheading="Configure how you receive alerts"
            />
            <div className="card-body rounded-t-none space-y-6">
                <label className="flex justify-between items-center cursor-pointer">
                    <div>
                        <h3 className="heading-3">Weekly Management Report</h3>
                        <p className="subheading">
                            A Sunday morning email summarizing reports generated,
                            risk alerts, notifications sent, and AI usage cost
                            for the week.
                        </p>
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