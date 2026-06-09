import { useNavigate } from "react-router-dom";

import SubjectForm from "../components/subjects/SubjectForm";
import { createSubject } from "../services/subjectService";

function AddSubjectPage() {
    const navigate = useNavigate();

    const handleSubmit = async (data) => {
        try {
            await createSubject(data);

            navigate("/subjects");
        } catch (error) {
            console.error("Create error:", error);
        }
    };

    return (
        <div>
            <h1>Add Subject</h1>

            <SubjectForm onSubmit={handleSubmit} />
        </div>
    );
}

export default AddSubjectPage;