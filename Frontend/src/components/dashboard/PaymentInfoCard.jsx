import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PaymentContext } from "../../context/PaymentContext";

const PaymentInfoCard = () => {
    const { summary, fetchSummary, summaryLoading } = useContext(PaymentContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSummary();
    }, []);

    if (!summaryLoading && summary && summary.overdue_count === 0) return null;

    return (
        <div className="card overflow-hidden">
            <div className="bg-warning-bg border-b border-warning/30 px-5 py-4">
                <div className="flex items-center gap-2">
                    <div className="stat-icon-wrap-warn w-6! h-6! mb-0!">
                        <svg
                            className="w-6 h-6 text-danger fill-current"
                            viewBox="0 0 56 56"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M 27.9999 51.9063 C 41.0546 51.9063 51.9063 41.0781 51.9063 28 C 51.9063 14.9453 41.0312 4.0937 27.9765 4.0937 C 14.8983 4.0937 4.0937 14.9453 4.0937 28 C 4.0937 41.0781 14.9218 51.9063 27.9999 51.9063 Z M 27.9999 47.9219 C 16.9374 47.9219 8.1014 39.0625 8.1014 28 C 8.1014 16.9609 16.9140 8.0781 27.9765 8.0781 C 39.0155 8.0781 47.8983 16.9609 47.9219 28 C 47.9454 39.0625 39.0390 47.9219 27.9999 47.9219 Z M 27.9765 32.2422 C 29.1014 32.2422 29.7343 31.6094 29.7577 30.3906 L 30.1093 18.0156 C 30.1327 16.8203 29.1952 15.9297 27.9530 15.9297 C 26.6874 15.9297 25.7968 16.7968 25.8202 17.9922 L 26.1249 30.3906 C 26.1483 31.5859 26.8046 32.2422 27.9765 32.2422 Z M 27.9765 39.8594 C 29.3124 39.8594 30.5077 38.7812 30.5077 37.4219 C 30.5077 36.0390 29.3358 34.9844 27.9765 34.9844 C 26.5936 34.9844 25.4452 36.0625 25.4452 37.4219 C 25.4452 38.7578 26.6171 39.8594 27.9765 39.8594 Z"/>
                        </svg>
                    </div>
                    <h3 className="heading-3 text-warning">
                        Outstanding Payments
                    </h3>
                </div>
            </div>

            <div className="p-5">
                {summaryLoading ? (
                    <div className="space-y-2">
                        <div className="skeleton skeleton-text w-3/4" />
                        <div className="skeleton skeleton-btn w-32 mt-4" />
                    </div>
                ) : summary ? (
                    <>
                        <p className="text-body">
                            You have{" "}
                            <span className="font-semibold">
                                {summary.overdue_count} overdue payment{summary.overdue_count !== 1 ? "s" : ""}
                            </span>{" "}
                            totaling{" "}
                            <span className="font-semibold text-warning">
                                {parseFloat(summary.overdue_total).toLocaleString()} EGP
                            </span>
                            . Review and follow up to improve cash flow.
                        </p>
                        <button
                            className="btn-primary mt-4"
                            onClick={() => navigate("/payments")}
                        >
                            View Payments
                        </button>
                    </>
                ) : (
                    <p className="text-body text-blue">Failed to load payment data.</p>
                )}
            </div>
        </div>
    );
};

export default PaymentInfoCard;