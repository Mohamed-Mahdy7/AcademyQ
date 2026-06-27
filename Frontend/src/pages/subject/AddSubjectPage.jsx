import { useNavigate } from "react-router-dom";
import SubjectForm from "../../components/subjects/SubjectForm";
import { createSubject } from "../../services/subjectService";
import { toast } from "../../lib/toastBus";

function AddSubjectPage() {
    const navigate = useNavigate();

    const handleSubmit = async (data) => {
        try {
            await createSubject(data);
            toast.success("Subject created", "The subject has been created successfully.");
            navigate("/subjects");
        } catch (error) {
            const responseData = error.response?.data;
            const message =
                responseData?.detail ||
                responseData?.non_field_errors?.[0] ||
                Object.values(responseData || {}).flat()[0] ||
                "Failed to create the subject. Please try again.";
            toast.danger("Create failed", message);
            throw error; // re-throw so SubjectForm can set field-level errors
        }
    };

    return (
        <div className="page-body max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <button className="btn-icon" onClick={() => navigate("/subjects")}>
                    ←
                </button>
                <div>
                    <h1 className="heading-1">Add Subject</h1>
                    <p className="subheading">Create a new subject for your academy</p>
                </div>
            </div>
            <div className="card-body">
                <SubjectForm onSubmit={handleSubmit} />
            </div>
        </div>
    );
}

export default AddSubjectPage;