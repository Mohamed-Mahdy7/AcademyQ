import { useContext, useState } from "react"
import KpiCard from "../../components/KpiCard"
import { UsersContext } from "../../context/UsersContext"
import UserRegister from "../auth/UsersRegisterPage"
import EditUserProfile from "./EditUserProfile"
import { useTranslation } from "react-i18next"

const UserManagement = () => {
    const { t } = useTranslation(["staff", "common"]);
    const { users } = useContext(UsersContext)
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
                    <h1 className="heading-1">{t("staff_users")}</h1>
                    <p className="subheading">{t("manage_staff_desc")}</p>
                </div>
                <button
                    onClick={() => setShowRegister(true)}
                    className="btn-primary h-3/5"
                >
                    + {t("add_user")}
                </button>
            </div>

            <div className={showRegister ? "pointer-events-none" : ""}>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 my-6">
                    <KpiCard title={t("total_staff").toUpperCase()} 
                    svg={
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-cog w-4 h-4 text-blue"><circle cx="18" cy="15" r="3"></circle><circle cx="9" cy="7" r="4"></circle><path d="M10 15H6a4 4 0 0 0-4 4v2"></path><path d="m21.7 16.4-.9-.3"></path><path d="m15.2 13.9-.9-.3"></path><path d="m16.6 18.7.3-.9"></path><path d="m19.1 12.2.3-.9"></path><path d="m19.6 18.7-.4-1"></path><path d="m16.8 12.3-.4-1"></path><path d="m14.3 16.6 1-.4"></path><path d="m20.7 13.8 1-.4"></path></svg>
                    }
                    value={totalStaff} />
                    <KpiCard title={t("admins").toUpperCase()} 
                    svg={
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield w-4 h-4 text-blue"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
                    }
                    value={admins} />
                    <KpiCard title={t("teachers").toUpperCase()} 
                    svg={
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    }
                    value={teachers} />
                </div>
            </div>

            {showRegister && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowRegister(false)}
                    />
                    <div className="relative z-10 w-full max-w-5xl mx-4 bg-white rounded-3xl shadow-2xl">
                        <button
                            onClick={() => setShowRegister(false)}
                            className="absolute top-6 right-6 text-3xl text-navy"
                        >
                            x
                        </button>
                        <UserRegister onClose={() => setShowRegister(false)} />
                    </div>
                </div>
            )}

            <div className="table-wrap">
                <div className="card-header">
                    <h1 className="heading-3">{t("all_staff_users")}</h1>
                </div>
                <table className="table">
                    <thead className="table-thead">
                        <tr>
                            <th>{t("name").toUpperCase()}</th>
                            <th>{t("email").toUpperCase()}</th>
                            <th>{t("phone").toUpperCase()}</th>
                            <th>{t("role").toUpperCase()}</th>
                            <th>{t("status").toUpperCase()}</th>
                            <th>{t("created").toUpperCase()}</th>
                            <th className="text-end">{t("actions").toUpperCase()}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users
                            .filter(user => user.role !== "S")
                            .map((user) => (
                                <tr key={user.id} className="table-row">
                                    <td className="table-cell font-medium">{user.full_name}</td>
                                    <td className="table-cell">{user.email}</td>
                                    <td className="table-cell">{user.phone}</td>
                                    <td className="table-cell">
                                        {user.role === 'A'
                                            ? <span className="badge-navy">{user.role_display}</span>
                                            : <span className="badge-info">{user.role_display}</span>
                                        }
                                    </td>
                                    <td className="table-cell">
                                        {user.status === 'A'
                                            ? <span className="badge-success">{user.status_display}</span>
                                            : user.status === 'P'
                                                ? <span className="badge-warning">{user.status_display}</span>
                                                : <span className="badge-danger">{user.status_display}</span>
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
                                                    setSelectedUserId(user.id);
                                                    setShowProfile(true);
                                                }}
                                            >
                                                {t("edit")}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>

                {showProfile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                            onClick={() => setShowProfile(false)}
                        />
                        <div className="relative z-10 w-full max-w-5xl mx-4 bg-white rounded-3xl shadow-2xl">
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

export default UserManagement;