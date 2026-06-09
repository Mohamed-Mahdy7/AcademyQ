import { useNavigate } from "react-router-dom";
import ClassForm from "../components/classes/ClassForm";
import { createClass } from "../services/classService";

function AddClassPage() {
    const navigate = useNavigate();

    const handleSubmit = async (data) => {
        try {
            await createClass(data);
            navigate("/classes");
        } catch (error) {
            throw error;
        }
    };

    return (
        <div className="page-body max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <button
                    className="btn-icon"
                    onClick={() => navigate("/classes")}
                >
                    ←
                </button>
                <div>
                    <h1 className="heading-1">Create Class</h1>
                    <p className="subheading">Add a new class to your academy</p>
                </div>
            </div>
            <div className="card-body">
                <ClassForm onSubmit={handleSubmit} />
            </div>
        </div>
    );
}

export default AddClassPage;