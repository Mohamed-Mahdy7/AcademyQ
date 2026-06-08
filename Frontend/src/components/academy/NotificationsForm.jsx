import { useContext } from "react";
import ForomHeading from "./FormHeading";

export default function Notifications() {
    return (
        <>
            <ForomHeading 
                heading="Notifications"
                subheading="Configure how you receive alerts"
            />
            <div className="card-body rounded-t-none">
                <p className="subheading my-3">Notification settings comming soon...</p>
            </div>
        </>
    )
}