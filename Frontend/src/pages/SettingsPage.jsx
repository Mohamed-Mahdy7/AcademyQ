import { useContext, useEffect, useState } from "react";
import { AcademyContext } from "../context/AcademyContext";
import { useNavigate } from "react-router-dom";

function AcademyProfile() {
    const { academy, updateAcademy } = useContext(AcademyContext);
    const navigate = useNavigate();

    const [academyName, setAcademyName] = useState("");
    const [academyEmail, setAcademyEmail] = useState("");
    const [academyPhone, setAcademyPhone] = useState("");
    const [address, setAddress] = useState("");

    useEffect(() => {
        if (academy) {
            setAcademyName(academy.academy_name || "");
            setAcademyEmail(academy.academy_email || "");
            setAcademyPhone(academy.academy_phone || "");
            setAddress(academy.address || "");
        }
    }, [academy]);

    async function handleSubmit(e) {
        e.preventDefault();

        const result = await updateAcademy({
            academy_name: academyName,
            academy_email: academyEmail,
            academy_phone: academyPhone,
            address,
        });

        if (result.success) {
            navigate("/settings");
        } else {
            alert("Failed to update academy profile");
        }
    }

    if (!academy) {
        return <p>Loading...</p>;
    }

    return (
        <>
        <div className="page-section max-w-4xl">
            <div className="mb-6">
                <h1 className="heading-1">Settings</h1>
                <p className="subheading">
                    Manage academy profile and preferences
                </p>
            </div>
            <div className="card-body rounded-b-none bg-gray-100">
                <h2 className="heading-2">Academy Profile</h2>
                <p className="subheading">
                    Update your academy's basic information
                </p>
            </div>
            <form onSubmit={handleSubmit} className="card-body rounded-t-none space-y-6">
                <div className="form-field">
                    <label htmlFor="academyName" className="form-label">
                        Academy Name
                    </label>
                    <input
                        type="text"
                        id="academyName"
                        value={academyName}
                        onChange={(e) =>
                            setAcademyName(e.target.value)
                        }
                        className="form-input"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="academyEmail" className="form-label">
                        Academy Email
                    </label>
                    <input
                        type="email"
                        id="academyEmail"
                        value={academyEmail}
                        onChange={(e) =>
                            setAcademyEmail(e.target.value)
                        }
                        className="form-input"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="academyPhone" className="form-label">
                        Academy Phone
                    </label>
                    <input
                        type="text"
                        id="academyPhone"
                        value={academyPhone}
                        onChange={(e) =>
                            setAcademyPhone(e.target.value)
                        }
                        className="form-input"
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="address" className="form-label">
                        Address
                    </label>
                    <textarea
                        id="address"
                        value={address}
                        onChange={(e) =>
                            setAddress(e.target.value)
                        }
                        className="form-textarea"
                    />
                </div>

                <div className="divider" />

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        className="btn-muted"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="btn-primary"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>

        </>
    );
}

export default AcademyProfile;