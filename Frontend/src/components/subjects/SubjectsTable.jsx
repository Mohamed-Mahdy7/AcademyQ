function SubjectsTable({ subjects, onEdit, onDelete }) {
    return (
        <table border="1" cellPadding="10">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Sessions</th>
                    <th>Classes</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {subjects.map((subject) => (
                    <tr key={subject.id}>
                        <td>{subject.name}</td>
                        <td>{subject.description}</td>
                        <td>{subject.session_count}</td>
                        <td>{subject.classes_count}</td>
                        <td>
                            <button onClick={() => onEdit(subject.id)}>
                                Edit
                            </button>
                            <button onClick={() => onDelete(subject.id)}>
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default SubjectsTable;