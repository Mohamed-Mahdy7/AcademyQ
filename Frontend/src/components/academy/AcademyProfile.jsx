import { AcademyContext } from "../../context/AcademyContext";
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormHeading from "./FormHeading";

export default function AcademyProfileForm() {
    const { academy, updateAcademy } = useContext(AcademyContext);
    const [academyName, setAcademyName] = useState("");
    const [academyEmail, setAcademyEmail] = useState("");
    const [academyPhone, setAcademyPhone] = useState("");
    const [address, setAddress] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (academy) {
            setAcademyName(academy.name || "");
            setAcademyEmail(academy.email || "");
            setAcademyPhone(academy.phone || "");
            setAddress(academy.address || "");
        }
    }, [academy]);

    async function handleSubmit(e) {
        e.preventDefault();
        setFieldErrors({});
        setSaving(true);

        const result = await updateAcademy({
            name: academyName,
            email: academyEmail,
            phone: academyPhone,
            address,
        });

        setSaving(false);

        if (result.success) {
            navigate("/settings");
        } else if (result.error?.response?.data?.code === "validation_error") {
            setFieldErrors(result.error.response.data.fields || {});
        }
    }

    if (!academy) {
        return <div className="skeleton skeleton-card" />;
    }

    return (
        <>
            <FormHeading
                heading="Academy Profile"
                subheading="Update your academy's basic information"
            />
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
                        className={fieldErrors.name ? "form-input-error" : "form-input"}
                    />
                    {fieldErrors.name && <p className="form-error">{fieldErrors.name[0]}</p>}
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
                        className={fieldErrors.email ? "form-input-error" : "form-input"}
                    />
                    {fieldErrors.email && <p className="form-error">{fieldErrors.email[0]}</p>}
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
                        className={fieldErrors.phone ? "form-input-error" : "form-input"}
                    />
                    {fieldErrors.phone && <p className="form-error">{fieldErrors.phone[0]}</p>}
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
                        className={fieldErrors.address ? "form-input-error" : "form-textarea"}
                    />
                    {fieldErrors.address && <p className="form-error">{fieldErrors.address[0]}</p>}
                </div>

                <div className="divider" />

                <div className="flex justify-end gap-3">
                    <button type="button" className="btn-muted">Cancel</button>
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? <span className="btn-spinner" /> : "Save Changes"}
                    </button>
                </div>
            </form>
        </>
    )
}