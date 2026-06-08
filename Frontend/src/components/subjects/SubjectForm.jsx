import { useState } from "react";

function SubjectForm({ onSubmit, initialData = {} }) {
    const [formData, setFormData] = useState({
        name: initialData.name || "",
        description: initialData.description || "",
        session_count: initialData.session_count || "",
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSubmit({
                name: formData.name,
                description: formData.description,
                session_count: Number(formData.session_count),
            });
        } catch (error) {
            if (error.response?.data) {
                setErrors(error.response.data);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Name</label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                {errors.name && <span>{errors.name}</span>}
            </div>
            <div>
                <label>Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                />
                {errors.description && <span>{errors.description}</span>}
            </div>
            <div>
                <label>Session Count</label>
                <input
                    type="number"
                    name="session_count"
                    value={formData.session_count}
                    onChange={handleChange}
                    required
                    min="1"
                />
                {errors.session_count && <span>{errors.session_count}</span>}
            </div>
            {errors.non_field_errors && <p>{errors.non_field_errors}</p>}
            <button type="submit">Save</button>
        </form>
    );
}

export default SubjectForm;