import { useState } from "react"
import { useAlerts } from "../../context/AlertContext"
import { NotificationsContext } from "../../context/NotificationsContext"

const initials = (name = "") =>
    name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()

const REASON_META = {
    low_attendance: { label: "Low Attendance", icon: "📉" },
    overdue_fee:    { label: "Overdue Fee",     icon: "💳" },
    low_grades:     { label: "Low Grades",      icon: "📝" },
    combined:       { label: "Combined Risk",   icon: "⚠️" },
}

const RISK_BADGE = {
    high:   "badge-pct-bad",
    medium: "badge-pct-warn",
    low:    "badge-pct-good",
}

const AlertRow = ({ alert }) => {
    const {
        expandedId,
        toggleExpand,
        generatingId,
        generateMessage,
        dismissAlert,
        updateLocalMessage,
    } = useAlerts()

    const isExpanded   = expandedId === alert.id
    const isGenerating = generatingId === alert.id

    const [localMessage, setLocalMessage] = useState(alert.message || "")
    const [isSending, setIsSending]       = useState(false)
    const [sentSuccess, setSentSuccess]   = useState(false)
    const { sendNotification } = useContext(NotificationsContext);

    const handleGenerateMessage = async () => {
        const msg = await generateMessage(alert.id)
        if (msg) setLocalMessage(msg)
    }

    const handleSend = async () => {
        if (!alert.message) return;
        setIsSending(true);
        try {
            const result = await sendNotification({
                alert_id: alert.id,
                recipient_name: alert.student_name,
                recipient_email: alert.parent_email,   // use whatever API returns
                message: localMessage,
            });

            if (result.success) {
                setSentSuccess(true);
                setTimeout(() => dismissAlert(alert.id), 1200);
            }
        } finally {
            setIsSending(false);
        }
    };

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

            {/* ── Collapsed row ── */}
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
                    <span className={`text-lg font-bold ${
                        alert.risk_level === "high"
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

                <div className="hidden md:block flex-shrink-0 text-right">
                    <p className="text-caption">{formattedDate}</p>
                </div>

                <svg
                    className={`w-4 h-4 text-blue flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* ── Expanded detail panel ── */}
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
                                className={`btn-ghost text-xs px-2 py-1 flex items-center gap-1 ${isGenerating ? "opacity-60 pointer-events-none" : ""}`}
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
                            className={`btn-primary flex items-center gap-2 ${(!alert.message || isSending || sentSuccess) ? "opacity-60 pointer-events-none" : ""}`}
                            onClick={handleSend}
                        >
                            {isSending ? (
                                <><span className="btn-spinner" /> Sending…</>
                            ) : sentSuccess ? (
                                <>✅ Sent!</>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.054 23.02a.75.75 0 00.926.926l5.158-1.478A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.75 9.75 0 01-4.868-1.308l-.35-.207-3.623 1.038 1.038-3.623-.207-.35A9.75 9.75 0 0112 2.25c5.385 0 9.75 4.365 9.75 9.75S17.385 21.75 12 21.75z" />
                                    </svg>
                                    Send Via Email
                                </>
                            )}
                        </button>

                        <a href={`/students/${alert.enrollment}`} className="btn-secondary flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            View Student Profile
                        </a>

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