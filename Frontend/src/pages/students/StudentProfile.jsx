import { useContext, useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { StudentContext } from "../../context/StudentsContext"
import KpiCard from "../../components/KpiCard"
import EditStudentProfile from "./EditStudentProfile"
import StudentEnrollmentTab from "../../components/enrollments/StudentEnrollmentTab"
import StudentPaymentTab from "../../components/payments/StudentPaymentTab"
import AttendanceTab from "../../components/attendance/AttendanceTab"
import GradeHistoryTab from "../../components/grades/GradeHistoryTab"

const tabs = ["Enrollments", "Grades", "Payments", "Attendance"];


const StudentProfile = () => {
    const { student, getStudent } = useContext(StudentContext);
    const [activeTab, setActiveTab] = useState("Enrollments");
    const [showProfile, setshowProfile] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

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
                            onClick={() => navigate("/students")}
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
                            <span className="text-caption">Enrolled since {new Date(student.enrolled_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
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
                    <button 
                        className="btn-primary"
                        onClick={() => setshowProfile(true)}
                    >
                        Update Profile
                    </button>
                </div>
                {showProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setshowProfile(false)}
                    />

                    <div
                        className="relative z-10 w-full max-w-5xl mx-4 bg-white rounded-3xl shadow-2xl"
                    >
                        <button
                            onClick={() => setshowProfile(false)}
                            className="absolute top-6 right-6 text-3xl text-navy"
                        >
                            x
                        </button>

                        <EditStudentProfile
                            onClose={() => setshowProfile(false)}
                        />
                    </div>
                </div>
            )}
            </div>
            <div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
                    <KpiCard
                        title="ENROLLMENTS"
                        value={student.enrollments.length}
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
                <div className="tab-bar rounded-t-lg bg-gray-00 px-5">
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
                        <StudentEnrollmentTab studentId={student.id} />
                    )}
                    {activeTab === "Grades" && (
                        <GradeHistoryTab 
                        enrollmentId={student.enrollments.map(e => e.id)}
                        />
                    )}
                    {activeTab === "Payments" && (
                        <StudentPaymentTab studentId={student.id} />
                    )}
                    {activeTab === "Attendance" && (
                        <AttendanceTab studentId={student.id} />
                    )}
                </div>
            </div>
            </nav>

            </div>
        </>
    )
}

export default StudentProfile