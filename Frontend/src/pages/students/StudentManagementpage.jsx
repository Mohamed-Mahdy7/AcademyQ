import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UsersContext } from "../../context/UsersContext"
import { StudentContext } from "../../context/StudentsContext"
import { AcademyContext } from "../../context/AcademyContext"
import { useTranslation } from "react-i18next"
import KpiCard from "../../components/KpiCard"
import StudentRegisterForm from "../auth/StudentRegisterForm"
import CardHeading from "../../components/CardHeader"

const StudentManagement = () => {
    const { students } = useContext(StudentContext);
    const { academy } = useContext(AcademyContext);
    const { t, i18n } = useTranslation(["students", "common"])
    const [showRegister, setShowRegister] = useState(false);
    const navigate = useNavigate();

    const activeStudents = students?.filter(student => student.status === 'A').length || 0;
    const studentsCount = students.length;
    const overdueStudents = students?.filter(student => student.overdue_days !== null).length || 0;


    return (
        <>
            <div className="flex justify-between">
                <div>
                    <h1 className="heading-1">{t("students_title")}</h1>
                    <p className="subheading">{t("manage_students_description")}</p>
                </div>
                <button
                    onClick={() => setShowRegister(true)}
                    className="btn-primary h-3/5"
                >
                    + {t("add_student")}
                </button>
            </div>
            <div className={showRegister ? "pointer-events-none" : ""}>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 my-6">
                    <KpiCard
                        title={t("total_students")}
                        value={studentsCount}
                    />
                    <KpiCard
                        title={t("common:active")}
                        value={activeStudents}
                    />
                    <KpiCard
                        title={t("with_overdue_payments")}
                        value={overdueStudents}
                    />
                </div>
            </div>

            {showRegister && (
                <div className="fixed inset-0  z-50 flex items-center justify-center">

                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowRegister(false)}
                    />

                    <div
                        className="relative z-10 w-3/5 max-w-5xl mx-4 bg-white rounded-3xl shadow-2xl"
                    >
                        <button
                            onClick={() => setShowRegister(false)}
                            className="absolute top-0 right-6 text-3xl text-navy"
                        >
                            x
                        </button>
                        <StudentRegisterForm
                            academyId={academy?.id}
                            onSuccess={() => setShowRegister(false)}
                        />
                    </div>
                </div>
            )}
            <div className="table-wrap">
                <div className="card-header">
                    <h1 className="heading-3">{t("all_students")}</h1>
                </div>
                <table className="table">
                    <thead className="table-thead">
                        <tr>
                            <th>{t("student_name")}</th>
                            <th>{t("parent_email_header")}</th>
                            <th>{t("grade_level")}</th>
                            <th>{t("enrollments")}</th>
                            <th>{t("common:status")}</th>
                            <th>{t("enrolled_since")}</th>
                            <th className="text-end">{t("common:actions")}</th>
                        </tr>
                    </thead>

                    <tbody>
                        {students.map((student) => (
                            <tr key={student.id} className="table-row">
                                <td className="table-cell font-medium">
                                    {student.full_name}
                                </td>
                                <td className="table-cell">
                                    {student.parent_email}
                                </td>
                                <td className="table-cell">
                                    {student.educational_level}
                                </td>
                                <td className="table-cell">
                                    {student.enrollments}
                                </td>
                                <td className="table-cell">
                                    {student.status === 'A' ?
                                        <span className="badge-success">
                                            {student.status_display}
                                        </span>
                                        : student.status === 'P' ?
                                            <span className="badge-warning">
                                                {student.status_display}
                                            </span>
                                            :
                                            <span className="badge-danger">
                                                {student.status_display}
                                            </span>
                                    }
                                </td>
                                <td className="table-cell">
                                    {student.enrolled_at
                                        ? `${t("enrolled_since_date")} ${new Date(student.enrolled_at).toLocaleDateString()}`
                                        : t("not_enrolled_yet")
                                    }
                                </td>
                                <td className="table-cell">
                                    <div className="flex justify-end">
                                        <button
                                            className="btn-secondary"
                                            onClick={() => (navigate(`/student/${student.id}`))}
                                        >
                                            {t("common:view_profile")}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default StudentManagement