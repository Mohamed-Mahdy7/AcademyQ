import KpiCardsSection from "../components/dashboard/KpiCardsSection"
import AtRiskCard from "../components/dashboard/AtRiskCard"
import ActivityCard from "../components/dashboard/ActivityCard"
import PaymentInfoCard from "../components/dashboard/PaymentInfoCard"
import RetentionRiskCard from "../components/ai/RetentionRiskCard"
import RetentionScanCard from "../components/ai/RetentionScanCard"
import PaymentReminderCard from "../components/dashboard/PaymentReminderCard"

const Dashboard = () => {
    return (
        <>
            <div className="mb-6">
                <h1 className="heading-1">Welcome!</h1>
                <p className="subheading">Here's what's happenning at your academy today.</p>
            </div>

            <KpiCardsSection />

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <AtRiskCard />
                <ActivityCard />
            </section>

            <div className="mb-6">
                <PaymentInfoCard />
            </div>

            {/* AI Retention Intelligence section */}
            <div className="mt-20 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-navy-mid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="heading-3">AI Retention Intelligence</h2>
                <span className="badge-info text-xs">Powered by AI</span>
            </div>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <RetentionRiskCard />
                <RetentionScanCard />
                <PaymentReminderCard />
            </section>
        </>
    )
}

export default Dashboard