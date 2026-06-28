import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ClassForm from "../../components/classes/ClassForm";
import { createClass } from "../../services/classService";
import { toast } from "../../lib/toastBus";

function AddClassPage() {
    const { t } = useTranslation(["classes", "common"]);
    const navigate = useNavigate();

    const handleSubmit = async (data) => {
        try {
            await createClass(data);
            toast.success(t("class_created"), t("class_created_desc"));
            navigate("/classes");
        } catch (error) {
            const responseData = error.response?.data;
            const message =
                responseData?.detail ||
                responseData?.non_field_errors?.[0] ||
                Object.values(responseData || {}).flat()[0] ||
                t("failed_to_create_class");
            toast.danger(t("create_failed"), message);
            throw error;
        }
    };

    return (
        <div className="page-body max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <button className="btn-icon" onClick={() => navigate("/classes")}>←</button>
                <div>
                    <h1 className="heading-1">{t("create_class")}</h1>
                    <p className="subheading">{t("add_class_page_desc")}</p>
                </div>
            </div>
            <div className="card-body">
                <ClassForm onSubmit={handleSubmit} />
            </div>
        </div>
    );
}

export default AddClassPage;