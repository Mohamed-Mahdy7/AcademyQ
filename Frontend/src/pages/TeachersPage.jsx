import { useState } from "react";
import { useTeacher } from "../context/TeachersContext";
import TeachersList from "../components/teachers/TeachersList";
import TeacherForm from "../components/teachers/TeacherForm";

export default function TeachersPage() {
  const { teachers, loading, error, addTeacher, editTeacher, removeTeacher } =
    useTeacher();

  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState("");

  function openAdd() {
    setEditingTeacher(null);
    setFormErrors({});
    setShowForm(true);
  }

  function openEdit(teacher) {
    setEditingTeacher(teacher);
    setFormErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingTeacher(null);
    setFormErrors({});
  }

  async function handleSubmit(payload, id) {
    const result = id
      ? await editTeacher(id, {
          rate_per_session: payload.rate_per_session,
          session_duration: payload.session_duration,
        })
      : await addTeacher(payload);

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

  return (
    <div>
      <div>
        <h1>Teachers</h1>
        <p>{teachers.length} teacher{teachers.length !== 1 ? "s" : ""} in your academy</p>
        <button onClick={openAdd}>Add teacher</button>
      </div>

      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Loading teachers...</p>}
      {error && <p>{error}</p>}

      <TeachersList
        teachers={filtered}
        onEdit={openEdit}
        onDelete={setDeleteConfirm}
      />

      {showForm && (
        <TeacherForm
          editingTeacher={editingTeacher}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          errors={formErrors}
        />
      )}

      {deleteConfirm && (
        <div>
          <p>Deactivate {deleteConfirm.name}? They will no longer be able to log in.</p>
          <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button onClick={() => confirmDelete(deleteConfirm)}>Deactivate</button>
        </div>
      )}
    </div>
  );
}