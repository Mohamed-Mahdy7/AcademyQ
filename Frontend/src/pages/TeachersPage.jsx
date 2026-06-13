import { useState , useEffect} from "react";
import { useTeacher } from "../context/TeachersContext";
import { getClasses } from "../services/classService";
import TeachersList from "../components/teachers/TeachersList";
import TeacherForm from "../components/teachers/TeacherForm";

export default function TeachersPage() {
  const { teachers, loading, error, addTeacher, removeTeacher } = useTeacher();

  const [showForm, setShowForm]         = useState(false);
  const [formErrors, setFormErrors]     = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch]             = useState("");
  const [classes, setClasses] = useState([]);

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
    }
  }

  async function confirmDelete(teacher) {
    const result = await removeTeacher(teacher.id);
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

      {/* Header */}
      <div className="page-section">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="heading-1">Teachers</h1>
            <p className="subheading">Manage teacher profiles and class assignments</p>
          </div>
          <button className="btn-primary" onClick={openAdd}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add teacher
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="stat-grid mb-6">
        <div className="kpi-card">
          <p className="kpi-label">Total Teachers</p>
          <p className="kpi-value">{teachers.length}</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Active Classes</p>
          <p className="kpi-value">{activeClasses}</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Sessions</p>
          <p className="kpi-value">{totalSessions}</p>
        </div>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="input-icon-wrap flex-1 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-search"
          />
        </div>
        <div className="filter-bar-right">
          <p className="text-caption">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
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
          onEdit={() => {}}
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
              <h2 className="modal-title">Deactivate teacher?</h2>
              <button className="btn-icon" onClick={() => setDeleteConfirm(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <p className="alert-desc">
                  <strong>{deleteConfirm.name}</strong>'s account will be deactivated.
                  They will no longer be able to log in. No data will be deleted.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-muted" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => confirmDelete(deleteConfirm)}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}