import { useContext, useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { UsersContext } from "../../context/UsersContext"
import { StudentContext } from "../../context/StudentsContext"
import KpiCard from "../../components/KpiCard"
import StudentRegister from "../auth/StudentsRegisterPage"
import CardHeading from "../../components/CardHeader"
import EnrollmentTab from "../../components/enrollments/EnrollmentTab"

const tabs = ["Enrollments", "Grades", "Payments", "Attendance"];


const StudentProfile = () => {
    const { student, getStudent } = useContext(StudentContext);
    const [activeTab, setActiveTab] = useState("Enrollments");
    const { id } = useParams();

    useEffect(() => {
        getStudent(id);
    }, [id]);
    
    console.log("STUDENT: " , student)
    if (!student) {
        return <div>Loading...</div>;
    }

    const totalPaid = `${student.total_paid} EGP`
    const attendancePercentage = `${student.attendance_percentage} %`

    return (
        <>
            <div className="flex justify-between">
                <div className="flex gap-2">
                    <button className="pagination-btn border border-border">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="lucide lucide-arrow-left w-4 h-4 text-navy"
                        >
                            <path d="m12 19-7-7 7-7"></path>
                            <path d="M19 12H5"></path>
                        </svg>
                    </button>
                    <div>
                        <h1 className="heading-1">{student.full_name}</h1>
                        <div className="flex gap-2">
                            <span className="text-caption">{student.parent_phone}</span>
                            <span className="text-caption">Grade {student.educational_level}</span>
                            <span className="text-caption">Enrolled since {student.enrolled_at}</span>
                        </div>
                    </div>
                </div>
                {student.status === 'A' ?
                    <span className="badge-success h-6">
                        {student.status_display}
                    </span>
                    : student.status === 'P' ?
                        <span className="badge-warning h-6">
                            {student.status_display}
                        </span>
                        :
                        <span className="badge-danger h-6">
                            {student.status_display}
                        </span>
                }
            </div>
            <div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
                    <KpiCard
                        title="ENROLLMENTS"
                        value={student.enrollments}
                    />
                    <KpiCard
                        title="ATTENDANCE"
                        value={attendancePercentage}
                    />
                    <KpiCard
                        title="TOTAL PAID"
                        value={totalPaid}
                    />
                    <KpiCard
                        title="OUTSTANDING"
                        value=""
                    />
                </div>
            </div>

            <div>
            <nav>
                <div className="card">
                <div className="tab-bar rounded-t-lg bg-gray-100 px-5">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={activeTab === tab ? "tab-active" : "tab"}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    {activeTab === "Enrollments" && (
                        <div className="empty-state">
                            <p className="empty-state-title">Enrollments coming soon</p>
                            <p className="empty-state-desc">
                                Enrollments records will be available here.
                            </p>
                        </div>
                    )}
                    {activeTab === "Grades" && (
                        <div className="empty-state">
                            <p className="empty-state-title">Grades coming soon</p>
                            <p className="empty-state-desc">
                                Grades records will be available here.
                            </p>
                        </div>
                    )}
                    {activeTab === "Payments" && (
                        <div className="empty-state">
                            <p className="empty-state-title">Payments coming soon</p>
                            <p className="empty-state-desc">
                                Payments records will be available here.
                            </p>
                        </div>
                    )}
                    {activeTab === "Attendance" && (
                        <div className="empty-state">
                            <p className="empty-state-title">Attendance coming soon</p>
                            <p className="empty-state-desc">
                                Attendance records will be available here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            </nav>

            </div>
        </>
    )
}

export default StudentProfile