import { useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { UsersContext } from "../../context/UsersContext"
import api from "../../api"

const EditUserProfile = ({ userId, onClose }) => {
    const {
        user,
        updateUser,
        getUser
    } = useContext(UsersContext);
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("");
    const navigate = useNavigate();
    const roles = [
        { value: "A", label: "Admin" },
        { value: "T", label: "Teacher" },
    ]
    

    useEffect(() => {
        getUser(userId);
    }, [userId]);

    useEffect(() => {
        if (!user) return;

        setFullName(user.full_name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setRole(user.role || "");
    }, [user]);

    if (!user) {
        return <div>Loading...</div>;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const data = {
            full_name,
            email,
            phone,
            role,
        }
        try{
            const result = await updateUser(userId, data);
            if(result.success) {
                onClose();
                navigate(`/users/`)
            }
        } catch (error) {
            console.error(error);
            console.log(error.response?.data);
            throw error;
        }
    }

    return (
        <form 
            onSubmit={handleSubmit}
            className="form-card"
        >
            <h1 className="text-3xl font-bold text-navy mb-8">
                User Profile
            </h1>
            <div className="divider"></div>
            <div className="flex flex-col gap-3">
                <div>
                    <label htmlFor="fullName" className="form-label">Full Name</label>
                    <input 
                        type="text" 
                        name="fullName" 
                        id="fullName"
                        placeholder="Owner Full Name"
                        value={full_name}
                        onChange={(e) => setFullName(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="email" className="form-label">Email</label>
                    <input 
                        type="email" 
                        name="email" 
                        id="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="phone" className="form-label">Phone</label>
                    <input 
                        type="text" 
                        name="phone" 
                        id="phone"
                        placeholder="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="role">Role</label>
                    <select 
                        name="role" 
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        className="form-select"
                    >
                        <option value="">Select a role</option>
                        {roles.map((roleOption) => (
                            <option
                                key={roleOption.value}
                                value={roleOption.value}
                            >
                                {roleOption.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <button type="submit" className="btn-primary mt-4 w-full">Save Changes</button>
        </form>
    )
}

export default EditUserProfile