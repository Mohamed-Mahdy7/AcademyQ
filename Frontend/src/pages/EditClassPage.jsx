import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ClassForm from "../components/classes/ClassForm";
import { getClass, updateClass } from "../services/classService";

function EditClassPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClass = async () => {
            try {
                const response = await getClass(id);
                setClassData(response.data);
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClass();
    }, [id]);

    const handleSubmit = async (data) => {
        try {
            await updateClass(id, data);
            navigate("/classes");
        } catch (error) {
            throw error;
        }
    };

    if (loading) return <p className="p-6 text-sm text-blue">Loading...</p>;
    if (!classData) return <p className="p-6 text-sm text-danger">Class not found.</p>;

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
                    <h1 className="heading-1">Edit Class</h1>
                    <p className="subheading">Update class details</p>
                </div>
            </div>
            <div className="card-body">
                <ClassForm onSubmit={handleSubmit} initialData={classData} />
            </div>
        </div>
    );
}

export default EditClassPage;