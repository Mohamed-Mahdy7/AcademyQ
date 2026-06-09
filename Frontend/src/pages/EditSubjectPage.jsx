import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SubjectForm from "../components/subjects/SubjectForm";
import { getSubject, updateSubject } from "../services/subjectService";

function EditSubjectPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubject = async () => {
            try {
                const response = await getSubject(id);
                setSubject(response.data);
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubject();
    }, [id]);

    const handleSubmit = async (data) => {
        try {
            await updateSubject(id, data);
            navigate("/subjects");
        } catch (error) {
            throw error;
        }
    };

    if (loading) return <p className="p-6 text-sm text-blue">Loading...</p>;
    if (!subject) return <p className="p-6 text-sm text-danger">Subject not found.</p>;

    return (
        <div className="page-body max-w-2xl">

            <div className="flex items-center gap-3 mb-6">
                <button
                    className="btn-icon"
                    onClick={() => navigate("/subjects")}
                >
                    ←
                </button>
                <div>
                    <h1 className="heading-1">Edit Subject</h1>
                    <p className="subheading">Update subject details for your academy</p>
                </div>
            </div>

            <div className="card-body">
                <SubjectForm onSubmit={handleSubmit} initialData={subject} />
            </div>

        </div>
    );
}

export default EditSubjectPage;