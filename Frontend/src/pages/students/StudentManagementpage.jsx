import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UsersContext } from "../../context/UsersContext"
import { StudentContext } from "../../context/StudentsContext"
import KpiCard from "../../components/KpiCard"
import StudentRegister from "../auth/StudentsRegisterPage"
import CardHeading from "../../components/CardHeader"

const StudentManagement = () => {
    const { students } = useContext(StudentContext);
    const [showRegister, setShowRegister] = useState(false);
    const navigate = useNavigate();

    console.log("STUDENTS: ", students)
    const activeStudents = students?.filter(student => student.status === 'A').length || 0;
    const studentsCount = students.length;


    return (
        <>
            <div className="flex justify-between">
                <div>
                    <h1 className="heading-1">Students</h1>
                    <p className="subheading">Manage student profiles, enrollments, and progress</p>
                </div>
                <button
                    onClick={() => setShowRegister(true)}
                    className="btn-primary h-3/5"
                >
                    + Add Student
                </button>
            </div>
            <div className={showRegister ? "pointer-events-none" : ""}>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 my-6">
                    <KpiCard
                        title="TOTAL STUDENTS"
                        value={studentsCount}
                    />
                    <KpiCard
                        title="ACTIVE"
                        value={activeStudents}
                    />
                    <KpiCard
                        title="With Overdue Payments"
                        value="1"
                    />
                </div>
            </div>

            {showRegister && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">

                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowRegister(false)}
                    />

                    <div
                        className="relative z-10 w-full max-w-5xl mx-4 bg-white rounded-3xl shadow-2xl"
                    >
                        <button
                            onClick={() => setShowRegister(false)}
                            className="absolute top-6 right-6 text-3xl text-navy"
                        >
                            x
                        </button>

                        <StudentRegister
                            onClose={() => setShowRegister(false)}
                        />
                    </div>
                </div>
            )}
            <div className="table-wrap">
                <div className="card-header">
                    <h1 className="heading-3">All Students</h1>
                </div>
                <table className="table">
                    <thead className="table-thead">
                        <tr>
                            <th>STUDENT NAME</th>
                            <th>PARENT PHONE</th>
                            <th>GRADE LEVEL</th>
                            <th>ENROLLMENTS</th>
                            <th>STATUS</th>
                            <th>ENROLLED SINCE</th>
                            <th className="text-right">ACTIONS</th>
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
                                        ? `Enrolled since ${new Date(student.enrolled_at).toLocaleDateString()}`
                                        : "Not enrolled yet"
                                    }
                                </td>
                                <td className="table-cell">
                                    <div className="flex justify-end">
                                        <button 
                                            className="btn-secondary"
                                            onClick={() => (navigate(`/student/${student.id}`))}
                                        >
                                            View Profile
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