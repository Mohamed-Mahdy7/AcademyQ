import { AcademyContext } from "../../context/AcademyContext";
import { useContext } from "react";
import FormHeading from "./FormHeading";
import { useTranslation } from "react-i18next";

export default function SubscriptionForm() {
    const { t } = useTranslation(["settings", "common"]);
    const { academy } = useContext(AcademyContext);

    return (
        <>
            <FormHeading
                heading={t("subscription")}
                subheading={t("subscription_desc")}
            />
            <form className="card-body rounded-t-none">
                <div className="flex justify-between items-center my-2">
                    <div>
                        <h3 className="heading-3">{t("current_plan")}</h3>
                        <p className="subheading">{t("professional_plan")}</p>
                    </div>
                    <button className="btn-secondary">{t("upgrade")}</button>
                </div>
                <div className="divider" />
                <div className="flex justify-between items-center my-2">
                    <div>
                        <h3 className="heading-3">{t("subscription_ends")}</h3>
                        <p className="subheading">
                            {academy ? academy.subscription_end : null}
                        </p>
                    </div>
                    <button className="btn-secondary">{t("renew")}</button>
                </div>
            </form>
        </>
    );
}