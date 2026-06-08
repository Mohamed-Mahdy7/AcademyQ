import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
// academy_name, academy_email, academy_phone, 
//         full_name, email, phone, password, confirm_password
function Register() {
    const {register} = useContext(AuthContext)
    const [academy_name, setAcademyName] = useState("");
    const [academy_email, setAcademyEmail] = useState("");
    const [academy_phone, setAcademyPhone] = useState("");
    const [address, setAcademyAddress] = useState("")
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        const data = {
            academy_name,
            academy_email,
            academy_phone,
            address,
            full_name,
            email,
            phone,
            password,
            confirm_password,
        };
        const success = await register(data);
        if (!success) {
            alert("Invalid credintials");
        } else {navigate("/")}
    }

    return (
        <form 
            onSubmit={handleSubmit}
            className="form-card"
        >
            <h1 className="text-3xl font-bold text-navy mb-8">
                Academy Registration
            </h1>
            <div className="grid md:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="academyName" className="form-label">Academy Name</label>
                    <input 
                        type="text" 
                        name="academyName" 
                        id="academyName"
                        placeholder="Academy Name"
                        value={academy_name}
                        onChange={(e) => setAcademyName(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="academyEmail" className="form-label">Academy Email</label>
                    <input 
                        type="email" 
                        name="academyEmail" 
                        id="academyEmail"
                        placeholder="Academy Email"
                        value={academy_email}
                        onChange={(e) => setAcademyEmail(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="academyPhone" className="form-label">Academy Phone</label>
                    <input 
                        type="text" 
                        name="academyPhone" 
                        id="academyPhone"
                        placeholder="Academy Phone"
                        value={academy_phone}
                        onChange={(e) => setAcademyPhone(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="address" className="form-label">Address</label>
                    <input 
                        type="text" 
                        name="address" 
                        id="address"
                        placeholder="Address"
                        value={address}
                        onChange={(e) => setAcademyAddress(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>
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
            </div>
            <button type="submit" className="btn-primary mt-4 w-full">Register</button>
        </form>
    )

}

export default Register;