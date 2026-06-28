import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { useAlerts } from "../../context/AlertContext"
import { NotificationsContext } from "../../context/NotificationsContext"
import { toast } from "../../lib/toastBus"

const initials = (name = "") =>
    name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()

const REASON_META = {
    low_attendance: { label: "Low Attendance", icon: "📉" },
    overdue_fee: { label: "Overdue Fee", icon: "💳" },
    low_grades: { label: "Low Grades", icon: "📝" },
    combined: { label: "Combined Risk", icon: "⚠️" },
}

const RISK_BADGE = {
    high: "badge-pct-bad",
    medium: "badge-pct-warn",
    low: "badge-pct-good",
}

const AlertRow = ({ alert }) => {
    const navigate = useNavigate()
    const {
        expandedId,
        toggleExpand,
        generatingId,
        generateMessage,
        dismissAlert,
        updateLocalMessage,
    } = useAlerts()

    const isExpanded = expandedId === alert.id
    const isGenerating = generatingId === alert.id

    const [localMessage, setLocalMessage] = useState(alert.message || "")
    const [isSending, setIsSending] = useState(false)
    const [sentSuccess, setSentSuccess] = useState(false)
    const { sendAlertNotification } = useContext(NotificationsContext)

    const handleGenerateMessage = async () => {
        const msg = await generateMessage(alert.id)
        if (msg) setLocalMessage(msg)
    }

    const handleSend = async () => {
        if (!localMessage) return
        setIsSending(true)
        try {
            const result = await sendAlertNotification(alert.id, localMessage)
            if (result.success) {
                setSentSuccess(true)
                setTimeout(() => dismissAlert(alert.id), 1200)
            } else {
                toast.danger("Failed to send", "The message could not be delivered. Please try again.")
            }
        } finally {
            setIsSending(false)
        }
    }

    const reason = REASON_META[alert.primary_reason] ?? {
        label: alert.primary_reason,
        icon: "⚠️",
    }

    const formattedDate = alert.created_at
        ? new Date(alert.created_at).toLocaleDateString("en-EG", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "—"

    const messagePreview = (alert.message || "").slice(0, 60).trim()

    return (
        <div className={`card mb-3 transition-all ${isExpanded ? "border-blue shadow-[0_4px_16px_0_rgb(73_136_196/0.18)]" : ""}`}>

            <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-sky-pale rounded-xl transition-colors"
                onClick={() => toggleExpand(alert.id)}
            >
                <div className="avatar avatar-md flex-shrink-0">
                    {initials(alert.student_name)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="heading-4 truncate">{alert.student_name}</span>
                        <span className={`badge ${RISK_BADGE[alert.risk_level]}`}>
                            {alert.risk_level.charAt(0).toUpperCase() + alert.risk_level.slice(1)} Risk
                        </span>
                        <span className="badge-tag">
                            {reason.icon} {reason.label}
                        </span>
                    </div>
                    <p className="text-caption mt-0.5 truncate">{alert.class_name}</p>
                </div>

                <div className="hidden sm:flex flex-col items-center flex-shrink-0">
                    <span className="text-[11px] font-semibold text-blue uppercase tracking-widest">Score</span>
                    <span className={`text-lg font-bold ${alert.risk_level === "high"
                            ? "text-danger"
                            : alert.risk_level === "medium"
                                ? "text-warning"
                                : "text-success"
                        }`}>
                        {alert.risk_score}
                    </span>
                </div>

                <div className="hidden lg:block flex-shrink-0 w-52">
                    <p className="text-caption mb-0.5">Message preview</p>
                    <p className="text-body text-sm text-navy/60 truncate">
                        {messagePreview
                            ? `${messagePreview}${alert.message.length > 60 ? "…" : ""}`
                            : <span className="text-blue italic">No message yet</span>
                        }
                    </p>
                </div>

                <div className="hidden md:block flex-shrink-0 text-end">
                    <p className="text-caption">{formattedDate}</p>
                </div>

                <svg
                    className={`w-4 h-4 text-blue flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isExpanded && (
                <div className="border-t border-border px-5 py-4 space-y-4">

                    <div className="flex flex-wrap gap-4">
                        <div className="card-info px-3 py-2 rounded-lg flex items-center gap-2">
                            <span className="text-caption">Risk Score</span>
                            <span className="font-bold text-navy">{alert.risk_score}/100</span>
                        </div>
                        {alert.recommended_action && (
                            <div className="card-warning px-3 py-2 rounded-lg flex-1 min-w-0">
                                <p className="text-caption mb-0.5">Recommended Action</p>
                                <p className="text-body text-sm">{alert.recommended_action}</p>
                            </div>
                        )}
                    </div>

                    {alert.primary_reason && (
                        <div>
                            <p className="text-label mb-1">Primary Reason</p>
                            <p className="text-body">{alert.primary_reason}</p>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-label">AI-Generated Parent Message</p>
                            <button
                                className={`btn-ghost border border-blue-500 text-blue-500 text-xs px-2 py-1 flex items-center gap-1 ${
                                    isGenerating ? "opacity-60 pointer-events-none" : ""
                                }`}
                                onClick={handleGenerateMessage}
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="btn-spinner !w-3 !h-3 !border-navy/30 !border-t-navy" />
                                        Generating…
                                    </>
                                ) : (
                                    <>✨ {alert.message ? "Regenerate" : "Generate Message"}</>
                                )}
                            </button>
                        </div>

                        {alert.message ? (
                            <textarea
                                className="form-textarea w-full h-28 text-sm"
                                value={localMessage}
                                onChange={(e) => {
                                    setLocalMessage(e.target.value)
                                    updateLocalMessage(alert.id, e.target.value)
                                }}
                            />
                        ) : (
                            <div className="bg-muted rounded-lg px-4 py-6 text-center">
                                <p className="text-body-muted text-sm italic">
                                    No message generated yet. Click "Generate Message" to create one using AI.
                                </p>
                            </div>
                        )}
                    </div>

                    {alert.notes !== undefined && (
                        <div>
                            <p className="text-label mb-1.5">Internal Notes</p>
                            <p className="text-body text-sm text-navy/60 italic">
                                {alert.notes || "No notes added."}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
                        <button
                            className={`btn-primary flex items-center gap-2 ${(!localMessage || isSending || sentSuccess) ? "opacity-60 pointer-events-none" : ""}`}
                            onClick={handleSend}
                        >
                            {isSending ? (
                                <><span className="btn-spinner" /> Sending…</>
                            ) : sentSuccess ? (
                                <>✅ Sent!</>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Send Via Email
                                </>
                            )}
                        </button>

                        <button
                            className="btn-secondary flex items-center gap-2"
                            onClick={() => navigate(`/student/${alert.student_id}`)}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            View Student Profile
                        </button>

                        <button
                            className="btn-ghost ml-auto text-danger hover:bg-danger-bg"
                            onClick={() => dismissAlert(alert.id)}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AlertRow