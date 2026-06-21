import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";


function Register() {
    const { register } = useContext(AuthContext)
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

        if (password !== confirm_password) {
            alert("Passwords do not match");
            return;
        }

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
        } else { navigate("/") }
    }

    return (
        <div className=" w-6/12 mx-auto py-10 align-middle">
            <form onSubmit={handleSubmit} className="form-card">
                <h1 className="text-3xl font-bold text-navy mb-8">
                    Academy Registration
                </h1>
                <div>
                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="academyName" className="form-label m-0">Academy Name</label>
                        <input
                            type="text"
                            name="academyName"
                            id="academyName"
                            placeholder="Academy Name"
                            value={academy_name}
                            onChange={(e) => setAcademyName(e.target.value)}
                            className="form-input w-9/12"
                            required
                        />
                    </div>
                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="academyEmail" className="form-label m-0">Academy Email</label>
                        <input
                            type="email"
                            name="academyEmail"
                            id="academyEmail"
                            placeholder="Academy Email"
                            value={academy_email}
                            onChange={(e) => setAcademyEmail(e.target.value)}
                            className="form-input w-9/12"
                            required
                        />
                    </div>
                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="academyPhone" className="form-label m-0">Academy Phone</label>
                        <input
                            type="text"
                            name="academyPhone"
                            id="academyPhone"
                            placeholder="Academy Phone"
                            value={academy_phone}
                            onChange={(e) => setAcademyPhone(e.target.value)}
                            className="form-input w-9/12"
                            required
                        />
                    </div>
                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="address" className="form-label m-0">Address</label>
                        <input
                            type="text"
                            name="address"
                            id="address"
                            placeholder="Address"
                            value={address}
                            onChange={(e) => setAcademyAddress(e.target.value)}
                            className="form-input w-9/12"
                            required
                        />
                    </div>
                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="fullName" className="form-label m-0">Owner Name</label>
                        <input
                            type="text"
                            name="fullName"
                            id="fullName"
                            placeholder="Full Name"
                            value={full_name}
                            onChange={(e) => setFullName(e.target.value)}
                            className="form-input w-9/12"
                            required
                        />
                    </div>
                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="email" className="form-label m-0">Owner Email</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input w-9/12"
                            required
                        />
                    </div>
                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="phone" className="form-label m-0">Owner Phone</label>
                        <input
                            type="text"
                            name="phone"
                            id="phone"
                            placeholder="Phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="form-input w-9/12"
                            required
                        />
                    </div>
                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="password" className="form-label m-0">Password</label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input w-9/12"
                            required
                        />
                    </div>
                    <div className="flex my-3 justify-between items-center">
                        <label htmlFor="confirmPassword" className="form-label m-0">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            placeholder="Confirm Password"
                            value={confirm_password}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-input w-9/12"
                            required
                        />
                    </div>
                </div>
                <button type="submit" className="btn-primary mt-4 w-full">Register</button>
            </form>
                <div className="flex gap-3 mt-4 items-center justify-center-safe">
                    <p className="subheading">Already have an account? </p>
                    <button 
                        className="btn-muted"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </button>
                </div>
        </div>
    )

}

export default Register;