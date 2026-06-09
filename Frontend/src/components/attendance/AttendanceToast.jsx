export default function AttendanceToast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`alert alert-${toast.type} mb-4`}>
      <span className="alert-title">{toast.message}</span>
    </div>
  );
}