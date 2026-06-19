import KpiCardsSection from "../components/dashboard/KpiCardsSection"
import AtRiskCard from "../components/dashboard/AtRiskCard"
import ActivityCard from "../components/dashboard/ActivityCard"
import PaymentInfoCard from "../components/dashboard/PaymentInfoCard"
import RetentionRiskCard from "../components/ai/RetentionRiskCard"
import RetentionScanCard from "../components/ai/RetentionScanCard"

const Dashboard = () => {
    return (
        <>
            <div className="mb-6">
            <h1 className="heading-1">Welcome!</h1>
            <p className="subheading">Here's what's happenning at your academy today.</p>
            </div>
            <KpiCardsSection />

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AtRiskCard />
                <ActivityCard />
            </section>

            <PaymentInfoCard />

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RetentionRiskCard />
                <RetentionScanCard />
            </section>
        </>
    )
}

export default Dashboard