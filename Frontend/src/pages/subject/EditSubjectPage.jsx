import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SubjectForm from "../../components/subjects/SubjectForm";
import { getSubject, updateSubject } from "../../services/subjectService";
import { toast } from "../../lib/toastBus";

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
            } catch {
                toast.danger(
                    "Unable to load subject",
                    "The requested subject could not be loaded."
                );
            } finally {
                setLoading(false);
            }
        };
        fetchSubject();
    }, [id]);

    const handleSubmit = async (data) => {
        try {
            await updateSubject(id, data);
            toast.success("Subject updated", "The subject has been updated successfully.");
            navigate("/subjects");
        } catch (error) {
            const responseData = error.response?.data;
            const message =
                responseData?.detail ||
                responseData?.non_field_errors?.[0] ||
                Object.values(responseData || {}).flat()[0] ||
                "Failed to update the subject. Please try again.";
            toast.danger("Update failed", message);
            throw error;
        }
    };

    if (loading)
        return <p className="p-6 text-sm text-blue">Loading...</p>;

    if (!subject)
        return (
            <div className="page-body max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <button className="btn-icon" onClick={() => navigate("/subjects")}>
                        ←
                    </button>
                    <h1 className="heading-1">Edit Subject</h1>
                </div>
                <div className="card-body">
                    <p className="text-sm text-danger">
                        Subject not found. It may have been deleted.
                    </p>
                </div>
            </div>
        );

    return (
        <div className="page-body max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <button className="btn-icon" onClick={() => navigate("/subjects")}>
                    ←
                </button>
                <div>
                    <h1 className="heading-1">Edit Subject</h1>
                    <p className="subheading">Update subject details for your academy</p>
                </div>
            </div>
            <div className="card-body">
                <SubjectForm initialData={subject} onSubmit={handleSubmit} />
            </div>
        </div>
    );
}

export default EditSubjectPage;