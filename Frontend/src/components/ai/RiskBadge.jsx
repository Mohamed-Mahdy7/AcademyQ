import { useTranslation } from "react-i18next";

export default function RiskBadge({ riskLevel }) {
  const { t } = useTranslation(["grades", "common"]);

  const config = {
    low: { label: t("low_risk"), className: "badge-success" },
    medium: { label: t("medium_risk"), className: "badge-warning" },
    high: { label: t("high_risk"), className: "badge-danger" },
  };

  const { label, className } = config[riskLevel] ?? {
    label: t("unknown_risk"),
    className: "badge-muted",
  };

  return <span className={className}>{label}</span>;
}