export default function CardHeading({heading, subheading}) {

    return (
        <div className="card-body rounded-b-none bg-card">
            <h2 className="heading-2">{heading}</h2>
            <p className="subheading">
                {subheading}
            </p>
        </div>
    )
}