import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSubjects, deleteSubject } from "../services/subjectService";
import SubjectsTable from "../components/subjects/SubjectsTable";

function SubjectsPage() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        try {
            const response = await getSubjects();
            setSubjects(response.data.results);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        navigate(`/subjects/${id}/edit`);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this subject?")) return;
        try {
            await deleteSubject(id);
            setSubjects((prev) => prev.filter((s) => s.id !== id));
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    if (loading) return <p>Loading...</p>;

    const totalSubjects = subjects.length;
    const totalClasses = subjects.reduce((sum, s) => sum + (s.classes_count || 0), 0);
    const avgSessions =
        totalSubjects > 0
            ? Math.round(
                  subjects.reduce((sum, s) => sum + (s.session_count || 0), 0) /
                      totalSubjects
              )
            : 0;

    return (
        <div>
            <h1>Subjects</h1>
            <p>Manage subject curriculum and class offerings</p>
            <hr />
            <p>Total Subjects: {totalSubjects}</p>
            <p>Total Classes: {totalClasses}</p>
            <p>Average Sessions: {avgSessions}</p>
            <hr />
            <button onClick={() => navigate("/subjects/add")}>Add Subject</button>
            <hr />
            <SubjectsTable
                subjects={subjects}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
}

export default SubjectsPage;