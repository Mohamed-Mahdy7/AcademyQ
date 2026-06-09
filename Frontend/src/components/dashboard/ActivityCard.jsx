import CardHeading from "../CardHeader"
import ActivityCardInfo from "./ActivityCardInfo"

const ActivityCard = () => {
    return (
        <>
            <div>
                <CardHeading 
                    heading="Recent Activity"
                    subheading="Latest updates across your academy"
                />
                <section className="card-body rounded-t-none h-4/5">
                    <ActivityCardInfo 
                        svg=""
                        heading="Payment of 500 EGP records for Ahmed Mohamed"
                        subheading="10/14/2025, 2:22:00 PM"
                    />
                    <ActivityCardInfo 
                        svg=""
                        heading="Sara Khaled enrolled in English B2 Wed/Fri"
                        subheading="10/13/2025, 12:10:00 PM"
                    />
                    <ActivityCardInfo 
                        svg=""
                        heading="Session 10 marked for Math G7 Mon/Wed -- 15/18 attended"
                        subheading="10/12/2025, 8:05:00 PM"
                    />
                </section>
            </div>
        </>
    )
}

export default ActivityCard