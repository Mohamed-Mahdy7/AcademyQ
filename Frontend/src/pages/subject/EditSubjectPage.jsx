import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SubjectForm from "../../components/subjects/SubjectForm";
import { getSubject, updateSubject } from "../../services/subjectService";
import { toast } from "../../lib/toastBus";

function EditSubjectPage() {
    const { t } = useTranslation(["subjects", "common"]);
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
                    t("unable_to_load_subject"),
                    t("subject_load_failed_desc")
                );
            } finally {
                setLoading(false);
            }
        };
        fetchSubject();
    }, [id, t]);

    const handleSubmit = async (data) => {
        try {
            await updateSubject(id, data);
            toast.success(t("subject_updated"), t("subject_updated_desc"));
            navigate("/subjects");
        } catch (error) {
            const responseData = error.response?.data;
            const message =
                responseData?.detail ||
                responseData?.non_field_errors?.[0] ||
                Object.values(responseData || {}).flat()[0] ||
                t("failed_to_update_subject");
            toast.danger(t("update_failed"), message);
            throw error;
        }
    };

    if (loading)
        return <p className="p-6 text-sm text-blue">{t("loading")}</p>;

    if (!subject)
        return (
            <div className="page-body max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <button className="btn-icon" onClick={() => navigate("/subjects")}>
                        ←
                    </button>
                    <h1 className="heading-1">{t("edit_subject")}</h1>
                </div>
                <div className="card-body">
                    <p className="text-sm text-danger">{t("subject_not_found")}</p>
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
                    <h1 className="heading-1">{t("edit_subject")}</h1>
                    <p className="subheading">{t("edit_subject_page_desc")}</p>
                </div>
            </div>
            <div className="card-body">
                <SubjectForm initialData={subject} onSubmit={handleSubmit} />
            </div>
        </div>
    );
}

export default EditSubjectPage;