import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ClassForm from "../../components/classes/ClassForm";
import { getClass, updateClass } from "../../services/classService";
import { toast } from "../../lib/toastBus";

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
            } catch {
                toast.danger(
                    "Unable to load class",
                    "The requested class could not be loaded."
                );
            } finally {
                setLoading(false);
            }
        };
        fetchClass();
    }, [id]);

    const handleSubmit = async (data) => {
        try {
            await updateClass(id, data);
            toast.success("Class updated", "Class has been updated successfully.");
            navigate("/classes");
        } catch (error) {
            const responseData = error.response?.data;
            const message =
                responseData?.detail ||
                responseData?.non_field_errors?.[0] ||
                Object.values(responseData || {}).flat()[0] ||
                "Failed to update the class. Please try again.";
            toast.danger("Update failed", message);
            throw error;
        }
    };

    if (loading)
        return <p className="p-6 text-sm text-blue">Loading...</p>;

    if (!classData)
        return (
            <div className="page-body max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <button className="btn-icon" onClick={() => navigate("/classes")}>←</button>
                    <h1 className="heading-1">Edit Class</h1>
                </div>
                <div className="card-body">
                    <p className="text-sm text-danger">Class not found. It may have been deleted.</p>
                </div>
            </div>
        );

    return (
        <div className="page-body max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <button className="btn-icon" onClick={() => navigate("/classes")}>←</button>
                <div>
                    <h1 className="heading-1">Edit Class</h1>
                    <p className="subheading">Update class details</p>
                </div>
            </div>
            <div className="card-body">
                <ClassForm onSubmit={handleSubmit} initialData={classData} isEditing />
            </div>
        </div>
    );
}

export default EditClassPage;