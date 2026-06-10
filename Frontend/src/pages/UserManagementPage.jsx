import { useContext, useState } from "react"
import KpiCard from "../components/KpiCard"
import { UsersContext } from "../context/UsersContext"
import UserRegister from "./UsersRegisterPage"

const UserManagement = () => {
    const {users} = useContext(UsersContext)
    const [showRegister, setShowRegister] = useState(false);

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
            <div className={showRegister? "pointer-events-none" : ""}>
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
        </>
    )
}

export default UserManagement