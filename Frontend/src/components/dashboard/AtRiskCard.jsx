import CardHeading from "../CardHeader"
import DangerCard from "../DangerCard"

const AtRiskCard = () => {
    return (
        <>
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
        </>
    )
}

export default AtRiskCard