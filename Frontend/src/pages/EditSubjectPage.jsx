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
        await updateSubject(id, data);   // let SubjectForm catch errors
        navigate("/subjects");
    };

    if (loading) return <p>Loading...</p>;
    if (!subject) return <p>Subject not found.</p>;

    return (
        <div>
            <h1>Edit Subject</h1>
            <SubjectForm onSubmit={handleSubmit} initialData={subject} />
        </div>
    );
}

export default EditSubjectPage;