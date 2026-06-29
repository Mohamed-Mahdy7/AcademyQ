import { useState } from "react";
import { useTranslation } from "react-i18next";
import ClassGradeSummaryTab from "./ClassGradeSummaryTab";
import GradeForm from "./GradeForm";

export default function GradesTabContent({ classId, enrollments, sessions, subjectName }) {
  const { t } = useTranslation(["grades", "common"]);
  const [view, setView] = useState("summary");

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="heading-3">
          {view === "summary" ? t("grade_summary") : t("add_grade")}
        </h3>
        {view === "summary" ? (
          <button className="btn-primary" onClick={() => setView("form")}>{t("assign_grade")}</button>
        ) : (
          <button className="btn-muted" onClick={() => setView("summary")}>{t("back_to_summary")}</button>
        )}
      </div>

      {view === "summary" ? (
        <ClassGradeSummaryTab classId={classId} enrollments={enrollments} sessions={sessions} />
      ) : (
        <GradeForm
          enrollments={enrollments}
          sessions={sessions}
          subjectName={subjectName}
          classId={classId}
          onSuccess={() => setView("summary")}
        />
      )}
    </div>
  );
}