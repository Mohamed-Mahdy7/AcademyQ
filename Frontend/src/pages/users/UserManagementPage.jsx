import { useContext, useState } from "react"
import KpiCard from "../../components/KpiCard"
import { UsersContext } from "../../context/UsersContext"
import UserRegister from "../auth/UsersRegisterPage"
import CardHeading from "../../components/CardHeader"
import EditUserProfile from "./EditUserProfile"

const UserManagement = () => {
    const { users, user } = useContext(UsersContext)
    const [showRegister, setShowRegister] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const totalStaff = users?.length || 0;
    const admins = users?.filter(user => user.role === 'A').length || 0;
    const teachers = users?.filter(user => user.role === 'T').length || 0;


    return (
        <>
            <div className="flex justify-between">
                <div>
                    <h1 className="heading-1">Staff Users</h1>
                    <p className="subheading">Manage staff accounts and permissions</p>
                </div>
                <button
                    onClick={() => setShowRegister(true)}
                    className="btn-primary h-3/5"
                >
                    + Add User
                </button>
            </div>
            <div className={showRegister ? "pointer-events-none" : ""}>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 my-6">
                    <KpiCard
                        title="TOTAL STAFF"
                        value={totalStaff}
                    />
                    <KpiCard
                        title="ADMINS"
                        value={admins}
                    />
                    <KpiCard
                        title="TEACHERS"
                        value={teachers}
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

                        <UserRegister
                            onClose={() => setShowRegister(false)}
                        />
                    </div>
                </div>
            )}
            <div className="table-wrap">
                <div className="card-header">
                    <h1 className="heading-3">All Staff Users</h1>
                </div>
                <table className="table">
                    <thead className="table-thead">
                        <tr>
                            <th>NAME</th>
                            <th>EMAIL</th>
                            <th>PHONE</th>
                            <th>ROLE</th>
                            <th>STATUS</th>
                            <th>CREATED</th>
                            <th className="text-end">ACTIONS</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users
                            .filter(user => user.role !== "S")
                            .map((user) => (
                                <tr key={user.id} className="table-row">
                                    <td className="table-cell font-medium">
                                        {user.full_name}
                                    </td>
                                    <td className="table-cell">
                                        {user.email}
                                    </td>
                                    <td className="table-cell">
                                        {user.phone}
                                    </td>
                                    <td className="table-cell">
                                        {user.role === 'A' ?
                                            <span className="badge-navy">
                                                {user.role_display}
                                            </span>
                                            :
                                            <span className="badge-info">
                                                {user.role_display}
                                            </span>
                                        }
                                    </td>
                                    <td className="table-cell">
                                        {user.status === 'A' ?
                                            <span className="badge-success">
                                                {user.status_display}
                                            </span>
                                            : user.status === 'P' ?
                                                <span className="badge-warning">
                                                    {user.status_display}
                                                </span>
                                                :
                                                <span className="badge-danger">
                                                    {user.status_display}
                                                </span>
                                        }
                                    </td>
                                    <td className="table-cell">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex justify-end">
                                            <button
                                                className="btn-secondary"
                                                onClick={() => {
                                                    setSelectedUserId(user.id)
                                                    setShowProfile(true)
                                                }}
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {showProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                            onClick={() => setShowProfile(false)}
                        />

                        <div
                            className="relative z-10 w-full max-w-5xl mx-4 bg-white rounded-3xl shadow-2xl"
                        >
                            <button
                                onClick={() => setShowProfile(false)}
                                className="absolute top-6 right-6 text-3xl text-navy"
                            >
                                x
                            </button>

                            <EditUserProfile
                                userId={selectedUserId}
                                onClose={() => setShowProfile(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default UserManagement