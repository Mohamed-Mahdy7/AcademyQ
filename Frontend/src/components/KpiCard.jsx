
export default function KpiCard({title, svg, value, caption}) {
    return(
        <>
            <div className="kpi-card">
            <div className="flex items-center justify-between">
                <p className="kpi-label">{title}</p>
                <div className="stat-icon-wrap mb-0">{svg}</div>
            </div>
            <p className="kpi-value">{value}</p>
            <p className="text-caption ">{caption}</p>
            </div>
        </>
    )
}