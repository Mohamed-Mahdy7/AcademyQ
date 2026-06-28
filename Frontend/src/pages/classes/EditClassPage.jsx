import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ClassForm from "../../components/classes/ClassForm";
import { getClass, updateClass } from "../../services/classService";
import { toast } from "../../lib/toastBus";

function EditClassPage() {
    const { t } = useTranslation(["classes", "common"]);
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
                    t("unable_to_load_class"),
                    t("class_load_failed_desc")
                );
            } finally {
                setLoading(false);
            }
        };
        fetchClass();
    }, [id, t]);

    const handleSubmit = async (data) => {
        try {
            await updateClass(id, data);
            toast.success(t("class_updated"), t("class_updated_desc"));
            navigate("/classes");
        } catch (error) {
            const responseData = error.response?.data;
            const message =
                responseData?.detail ||
                responseData?.non_field_errors?.[0] ||
                Object.values(responseData || {}).flat()[0] ||
                t("failed_to_update_class");
            toast.danger(t("update_failed"), message);
            throw error;
        }
    };

    if (loading)
        return <p className="p-6 text-sm text-blue">{t("common:loading")}</p>;

    if (!classData)
        return (
            <div className="page-body max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <button className="btn-icon" onClick={() => navigate("/classes")}>←</button>
                    <h1 className="heading-1">{t("edit_class")}</h1>
                </div>
                <div className="card-body">
                    <p className="text-sm text-danger">{t("class_not_found")}</p>
                </div>
            </div>
        );

    return (
        <div className="page-body max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <button className="btn-icon" onClick={() => navigate("/classes")}>←</button>
                <div>
                    <h1 className="heading-1">{t("edit_class")}</h1>
                    <p className="subheading">{t("edit_class_page_desc")}</p>
                </div>
            </div>
            <div className="card-body">
                <ClassForm onSubmit={handleSubmit} initialData={classData} isEditing />
            </div>
        </div>
    );
}

export default EditClassPage;