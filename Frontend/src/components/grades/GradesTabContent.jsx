import { useState } from "react";
import ClassGradeSummaryTab from "./ClassGradeSummaryTab";
import GradeForm from "./GradeForm";

export default function GradesTabContent({ classId, enrollments, sessions }) {
  const [view, setView] = useState("summary"); // "summary" | "form"

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="heading-3">
          {view === "summary" ? "Grade Summary" : "Assign Grade"}
        </h3>
        {view === "summary" ? (
          <button className="btn-primary" onClick={() => setView("form")}>
            Assign Grade
          </button>
        ) : (
          <button className="btn-muted" onClick={() => setView("summary")}>
            ← Back to Summary
          </button>
        )}
      </div>

      {view === "summary" ? (
        <ClassGradeSummaryTab classId={classId} enrollments={enrollments} />
      ) : (
        <GradeForm
          enrollments={enrollments}
          sessions={sessions}
          onSuccess={() => setView("summary")}
        />
      )}
    </div>
  );
}