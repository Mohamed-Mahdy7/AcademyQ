import KpiCardsSection from "../components/dashboard/KpiCardsScetion"
import CardHeading from "../components/CardHeader"
import DangerCard from "../components/DangerCard"
import ActivityCardInfo from "../components/dashboard/ActivityCardInfo"

const Dashboard = () => {
    return (
        <>
            <div className="mb-6">
            <h1 className="heading-1">Welcome!</h1>
            <p className="subheading">Here's what's happenning at your academy today.</p>
            </div>
            <KpiCardsSection />

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <CardHeading 
                        heading="At-Risk Students"
                        subheading="Students required immediate attention"
                    />
                    <section className="card-body rounded-t-none h-4/5">
                        <DangerCard 
                            name="Ahmed Mohamed"
                            warning="Low Attendace: 62.5%"
                            danger="Overdue: 500.00 EGP"
                            button="Contact"
                            info="Math G7 Mon/Wed"
                        />
                        <DangerCard 
                            name="Sara Khalid"
                            warning="Low Attendace: 58%"
                            button="Contact"
                            info="English B2 Wed/Fri"
                        />
                    </section>
                </div>
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
            </section>
        </>
    )
}

export default Dashboard