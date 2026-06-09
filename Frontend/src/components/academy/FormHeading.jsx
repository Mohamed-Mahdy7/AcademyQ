export default function FormHeading({ heading, subheading }) {

    return (
        <div className="card-body rounded-b-none bg-gray-100">
            <h2 className="heading-2">{heading}</h2>
            <p className="subheading">
                {subheading}
            </p>
        </div>
    )
}