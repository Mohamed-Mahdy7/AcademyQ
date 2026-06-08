import { useEffect, useState } from "react";
import { getSubjects } from "../services/subjectService";

function SubjectsPage() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await getSubjects();
                setSubjects(response.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h1>Subjects</h1>

            {subjects.map((subject) => (
                <div key={subject.id}>
                    <h3>{subject.name}</h3>
                    <p>{subject.description}</p>
                </div>
            ))}
        </div>
    );
}

export default SubjectsPage;