const ActivityCardInfo = ({svg, heading, subheading}) => {
    return(
        <>
            <div className="flex gap-5 my-4">
                <div className="stat-icon-wrap">
                    {svg}
                </div>
                <div>
                    <h3 className="heading-3">
                        {heading}
                    </h3>
                    <p className="subheading">
                        {subheading}
                    </p>
                </div>
            </div>
        </>
    )
}

export default ActivityCardInfo