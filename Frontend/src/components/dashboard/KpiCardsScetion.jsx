import KpiCard from "../KpiCard"

const KpiCardsSection = () => {
    return(
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
    )
}

export default KpiCardsSection