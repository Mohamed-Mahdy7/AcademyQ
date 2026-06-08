import ForomHeading from "../components/academy/FormHeading";
import AcademyProfileForm from "../components/academy/AcademyProfile";
import SubscriptionForm from "../components/academy/SubscriptionForm";
import Notifications from "../components/academy/NotificationsForm";

function AcademyProfile() {
    

    return (
        <>
        <div className="page-section max-w-4xl">
            <div className="mb-6">
                <h1 className="heading-1">Settings</h1>
                <p className="subheading">
                    Manage academy profile and preferences
                </p>
            </div>
            <AcademyProfileForm />
            <div className="my-14"></div>
            <SubscriptionForm />
            <div className="my-14"></div>
            <Notifications />
        </div>
        </>
    );
}

export default AcademyProfile;