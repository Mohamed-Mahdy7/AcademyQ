import { useState , useEffect} from "react";
import { useTeacher } from "../context/TeachersContext";
import { getClasses } from "../services/classService";
import { toast } from "../lib/toastBus";
import TeachersList from "../components/teachers/TeachersList";
import TeacherForm from "../components/teachers/TeacherForm";
import EditTeacherForm from "../components/teachers/EditTeacherForm";
import { UsersProvider } from "../context/UsersContext";
import { useTranslation } from "react-i18next";

export default function TeachersPage() {
  const { teachers, loading, error, addTeacher, removeTeacher, listTeachers } = useTeacher();

  const [showForm, setShowForm]         = useState(false);
  const [formErrors, setFormErrors]     = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const [search, setSearch]             = useState("");
  const [classes, setClasses] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const { t } = useTranslation("teacher");

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      const response = await getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error("Failed to load classes", error);
    }
  }

  function openAdd() {
    setFormErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setFormErrors({});
  }

  async function handleSubmit(payload) {
    setSubmitting(true);
    const result = await addTeacher(payload);
    setSubmitting(false);
    if (result.success) {
      closeForm();
    } else {
      setFormErrors(result.errors || {});
      if (result.errors?.detail) {
          toast.danger("Could not add teacher", result.errors.detail);
      }
    }
  }

  async function confirmDelete(teacher) {
    setDeleting(true);
    const result = await removeTeacher(teacher.id);
    setDeleting(false);
    if (result.success) setDeleteConfirm(null);
  }

  const filtered = teachers.filter(
    (t) =>
      !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeClasses = classes.filter(c => c.is_active).length;

  const totalSessions = classes.reduce(
    (sum, c) => sum + (c.session_count || 0),
    0
  );

  return (
    <div className="page-body">

      <div className="page-section">
        <div className="flex items-center justify-between mb-1">
          <div>
          <h1 className="heading-1">{t("page.title")}</h1>
          <p className="subheading">{t("page.subtitle")}</p>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t("page.add_button")}
          </button>
        </div>
      </div>

      <div className="stat-grid mb-6">
        <div className="kpi-card">
          <p className="kpi-label">{t("kpi.total_teachers")}</p>
          <p className="kpi-value">{teachers.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">{t("kpi.active_classes")}</p>
          <p className="kpi-value">{activeClasses}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">{t("kpi.sessions")}</p>
          <p className="kpi-value">{totalSessions}</p>
        </div>
      </div>

      <div className="filter-bar justify-between">
      <div className="input-icon-wrap flex-1 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder={t("search.placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-search"
            style={{ paddingLeft: "48px" }}
          />
        </div>
        <div className="filter-bar-right">
          <p className="text-caption">{t(`search.results${filtered.length !== 1 ? "_plural" : ""}`, { count: filtered.length })}</p>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-4">
          <p className="alert-desc">{error}</p>
        </div>
      )}

      {!loading && (
        <TeachersList
            teachers={filtered}
            onEdit={(teacher) => setEditingUserId(teacher.user_id)}
            onDelete={setDeleteConfirm}
        />
      )}

      {showForm && (
        <TeacherForm
          editingTeacher={null}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          errors={formErrors}
          submitting={submitting}
        />
      )}

      {deleteConfirm && (
        <div className="modal-backdrop">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">{t("delete_modal.title")}</h2>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <p className="alert-desc" dangerouslySetInnerHTML={{
                  __html: t("delete_modal.message", { name: deleteConfirm.name })
                }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-muted" onClick={() => setDeleteConfirm(null)}>{t("delete_modal.cancel")}</button>
              <button className={`btn-danger ${deleting ? "btn-disabled" : ""}`} disabled={deleting} onClick={() => confirmDelete(deleteConfirm)} >
                  {deleting ? <><span className="btn-spinner" /> {t("delete_modal.confirming")}</> : t("delete_modal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUserId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                  className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                  onClick={() => setEditingUserId(null)}
              />
              <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-2xl p-8">
                  <button
                      onClick={() => setEditingUserId(null)}
                      className="absolute top-6 right-6 text-2xl text-navy"
                  >
                      ✕
                  </button>
                  <UsersProvider>
                      <EditTeacherForm
                          userId={editingUserId}
                          onClose={() => {
                              setEditingUserId(null);
                              listTeachers();
                          }}
                      />
                  </UsersProvider>
              </div>
          </div>
      )}

    </div>
  );
}