import { useContext, useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { UsersContext } from "../../context/UsersContext"
import { StudentContext } from "../../context/StudentsContext"
import KpiCard from "../../components/KpiCard"
import StudentRegister from "../auth/StudentsRegisterPage"
import CardHeading from "../../components/CardHeader"

const StudentProfile = () => {
    const { student, getStudent } = useContext(StudentContext);
    const { id } = useParams();

    useEffect(() => {
        getStudent(id);
    }, [id]);

    console.log("STUDENT: " , student)
    if (!student) {
        return <div>Loading...</div>;
    }

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
                        value={student.attendance}
                    />
                    <KpiCard
                        title="TOTAL PAID"
                        value={student.total_paid}
                    />
                    <KpiCard
                        title="OUTSTANDING"
                        value=""
                    />
                </div>
            </div>

            <div>
            <nav>

            </nav>

            </div>
        </>
    )
}

export default StudentProfile