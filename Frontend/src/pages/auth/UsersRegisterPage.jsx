import { useContext, useState } from "react";
import { UsersContext } from "../../context/UsersContext";
import { useNavigate } from "react-router-dom";


function UserRegister({ onClose }) {
    const {createUser} = useContext(UsersContext)
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");
    const [role, setRole] = useState("");
    const navigate = useNavigate();
    const roles = [
        { value: "A", label: "Admin" },
        { value: "T", label: "Teacher" },
    ]

    async function handleSubmit(e) {
        e.preventDefault();

        if (password !== confirm_password) {
            alert("Passwords do not match");
            return;
        }
        
        const data = {
            full_name,
            email,
            phone,
            password,
            confirm_password,
            role,
        };
        const result = await createUser(data);

        if (!result.success) {
            alert("Invalid credentials");
        } else {
            onClose();
        }
    }


    return (
        <form 
            onSubmit={handleSubmit}
            className="form-card"
        >
            <h1 className="text-3xl font-bold text-navy mb-8">
                User Registration
            </h1>
            <div className="grid md:grid-cols-2 gap-5">
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
                    <label htmlFor="password" className="form-label">Password</label>
                    <input 
                        type="password" 
                        name="password" 
                        id="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input 
                        type="password" 
                        name="confirmPassword" 
                        id="confirmPassword"
                        placeholder="Confirm Password"
                        value={confirm_password}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
            <button type="submit" className="btn-primary mt-4 w-full">Register</button>
        </form>
    )

}

export default UserRegister;