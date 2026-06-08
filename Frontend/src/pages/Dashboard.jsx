import KpiCard from "../components/KpiCard"
import CardHeading from "../components/CardHeader"

const Dashboard = () => {
    return (
        <>
            <div className="mb-6">
            <h1 className="heading-1">Welcome!</h1>
            <p className="subheading">Here's what's happenning at your academy today.</p>
            </div>
            <div className="stat-grid mb-6">
                <KpiCard 
                    title="ACTIVE STUDENTS"
                    svg=""
                    value="87"
                    caption="112 total enrollments"
                />
                <KpiCard 
                    title="ACTIVE CLASSES"
                    svg=""
                    value="6"
                    caption="Accross all subjects"
                />
                <KpiCard 
                    title="MONTHLY REVENUE"
                    svg=""
                    value="10,500.55 EGP"
                    caption="84% collection rate"
                />
                <KpiCard 
                    title="ATTENDANCE RATE"
                    svg=""
                    value="81.5%"
                    caption="Last 28 days average"
                />
            </div>
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <CardHeading 
                        heading="At-Risk Students"
                        subheading="Students required immediate attention"
                    />
                    <section className="card-body rounded-t-none">
                    </section>
                </div>
                <div>
                    <CardHeading 
                        heading="Recent Activity"
                        subheading="Latest updates across your academy"
                    />
                    <section className="card-body rounded-t-none">
                    </section>
                </div>
            </section>
        </>
    )
}

export default Dashboard