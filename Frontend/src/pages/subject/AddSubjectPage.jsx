import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SubjectForm from "../../components/subjects/SubjectForm";
import { createSubject } from "../../services/subjectService";
import { toast } from "../../lib/toastBus";

function AddSubjectPage() {
    const { t } = useTranslation(["subjects", "common"]);
    const navigate = useNavigate();

    const handleSubmit = async (data) => {
        try {
            await createSubject(data);
            toast.success(t("subject_created"), t("subject_created_desc"));
            navigate("/subjects");
        } catch (error) {
            const responseData = error.response?.data;
            const message =
                responseData?.detail ||
                responseData?.non_field_errors?.[0] ||
                Object.values(responseData || {}).flat()[0] ||
                t("failed_to_create_subject");
            toast.danger(t("create_failed"), message);
            throw error;
        }
    };

    return (
        <div className="page-body max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <button className="btn-icon" onClick={() => navigate("/subjects")}>
                    ←
                </button>
                <div>
                    <h1 className="heading-1">{t("add_subject")}</h1>
                    <p className="subheading">{t("add_subject_page_desc")}</p>
                </div>
            </div>
            <div className="card-body">
                <SubjectForm onSubmit={handleSubmit} />
            </div>
        </div>
    );
}

export default AddSubjectPage;