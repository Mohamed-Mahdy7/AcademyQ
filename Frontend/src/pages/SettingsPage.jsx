import AcademyProfileForm from "../components/academy/AcademyProfile";
import SubscriptionForm from "../components/academy/SubscriptionForm";
import Notifications from "../components/academy/NotificationsForm";
import { useTranslation } from "react-i18next";

function SettingsPage() {
    const { t } = useTranslation(["settings", "common"]);

    return (
        <div className="page-section max-w-4xl">
            <div className="mb-6">
                <h1 className="heading-1">{t("settings")}</h1>
                <p className="subheading">{t("settings_desc")}</p>
            </div>
            <AcademyProfileForm />
            <div className="my-14" />
            <SubscriptionForm />
            <div className="my-14" />
            <Notifications />
        </div>
    );
}

export default SettingsPage;