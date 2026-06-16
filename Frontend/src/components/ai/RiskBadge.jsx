export default function RiskBadge({ riskLevel }) {
  const config = {
    low: {
      label: "Low Risk",
      className: "badge-success",
    },
    medium: {
      label: "Medium Risk",
      className: "badge-warning",
    },
    high: {
      label: "High Risk",
      className: "badge-danger",
    },
  };

  const { label, className } = config[riskLevel] ?? {
    label: "Unknown",
    className: "badge-muted",
  };

  return <span className={className}>{label}</span>;
}