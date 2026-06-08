import { AcademyContext } from "../../context/AcademyContext";
import { useContext } from "react";
import ForomHeading from "./FormHeading";

export default function SubscriptionForm() {
    const { academy } = useContext(AcademyContext);

    return(
        <>
            < ForomHeading 
                heading="Subscription"
                subheading="Manage your AcademiQ subscription"
            />
            <form className="card-body rounded-t-none">
                <div className="flex justify-between items-center my-2">
                    <div>
                    <h3 className="heading-3">Current Plan</h3>
                    <p className="subheading">Professional Plan</p>
                    </div>
                    <button className="btn-secondary">Upgrade</button>
                </div>
                <div className="divider"></div>
                <div className="flex justify-between items-center my-2">
                    <div>
                    <h3 className="heading-3">Subscribtion ends</h3>
                    <p className="subheading">{
                        academy?
                        academy.subscription_end 
                        : null}
                    </p>
                    </div>
                    <button className="btn-secondary">Renew</button>
                </div>
            </form>
        </>
    )

}