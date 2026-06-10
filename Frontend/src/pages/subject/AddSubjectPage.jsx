import { useNavigate } from "react-router-dom";
import SubjectForm from "../../components/subjects/SubjectForm";
import { createSubject } from "../../services/subjectService";

function AddSubjectPage() {
    const navigate = useNavigate();

    const handleSubmit = async (data) => {
        try {
            await createSubject(data);
            navigate("/subjects");
        } catch (error) {
            console.error("Create error:", error);
            throw error;
        }
    };

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