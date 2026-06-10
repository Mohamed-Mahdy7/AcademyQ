import { useContext, useEffect, useState } from "react";
import { StudentContext } from "../context/StudentsContext";
import { useNavigate } from "react-router-dom";
import api from "../api";

function StudentRegister() {
    const {createStudent} = useContext(StudentContext)
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [parent_phone, setParentPhone] = useState("");
    const [educational_level, setEducationalLevel] = useState("");
    const [academy, setAcademy] = useState("");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");
    const [educational_levels, setEducationalLevels] = useState([]);
    const [academies, setAcademies] = useState([]);
    const navigate = useNavigate();

    async function fetchEducationalLevels() {
        try{
            const response = await api.get("api/auth/educational_levels/");
            setEducationalLevels(response.data)
        } catch (error) {
            console.error(error)
        }
    }

    async function fetchAcademies() {
        try {
            const response = await api.get("api/auth/academies/");
            setAcademies(response.data.results);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        fetchEducationalLevels();
        fetchAcademies();
    }, []);


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
            parent_phone,
            academy,
            password,
            confirm_password,
            educational_level: Number(educational_level),
        };
        try{
            const result = await createStudent(data);
            if(result.success) {
                navigate("/")
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
                Student Registration
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
                    <label htmlFor="parentPhone" className="form-label">Parent phone</label>
                    <input 
                        type="text" 
                        name="parentPhone" 
                        id="parentPhone"
                        placeholder="parentPhone"
                        value={parent_phone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="academy">Academy</label>
                    <select
                        id="academy"
                        name="academy"
                        value={academy}
                        onChange={(e) => setAcademy(e.target.value)}
                        className="form-select"
                    >
                        {academies.map((academy) => (
                            <option
                                key={academy.id}
                                value={academy.id}
                            >
                                {academy.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="educational_level">educational_level</label>
                    <select 
                        name="educational_level" 
                        id="educational_level"
                        value={educational_level}
                        onChange={(e) => setEducationalLevel(Number(e.target.value))}
                        required
                        className="form-select"
                    >
                        <option value="">Select an educational level</option>
                        {educational_levels.map((level) => (
                            <option
                                key={level.value}
                                value={level.value}
                            >
                                {level.label}
                            </option>
                        ))}
                    </select>
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

export default StudentRegister;