import { useContext, useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { StudentContext } from "../../context/StudentsContext"
import api from "../../api"

const EditStudentProfile = ({ onClose }) => {
    const {
        student,
        updateStudent,
        getStudent
    } = useContext(StudentContext);
    const [full_name, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [parent_phone, setParentPhone] = useState("");
    const [educational_level, setEducationalLevel] = useState("");
    const [educational_levels, setEducationalLevels] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();
    
    async function fetchEducationalLevels() {
            try{
                const response = await api.get("api/auth/educational_levels/");
                setEducationalLevels(response.data)
            } catch (error) {
                console.error(error)
            }
        }

    useEffect(() => {
        getStudent(id);
    }, [id]);
    
    useEffect(() => {
        fetchEducationalLevels();
    }, []);

    useEffect(() => {
        if (!student) return;

        setFullName(student.full_name || "");
        setEmail(student.email || "");
        setPhone(student.phone || "");
        setParentPhone(student.parent_phone || "");
        setEducationalLevel(student.educational_level || "");
    }, [student]);

    if (!student) {
        return <div>Loading...</div>;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const data = {
            educational_level,
            email,
            full_name,
            parent_phone,
            phone,
        }
        try{
            const result = await updateStudent(id, data);
            if(result.success) {
                onClose();
                navigate(`/student/${result.data.id}`)
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
                Student Profile
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
            </div>
            <button type="submit" className="btn-primary mt-4 w-full">Save Changes</button>
        </form>
    )
}

export default EditStudentProfile