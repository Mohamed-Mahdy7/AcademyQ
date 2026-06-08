import { useContext } from "react";
import { AcademyContext } from "../context/AcademyContext";

function AcademyProfile() {
    const { academy, updateAcademy } = useContext(AcademyContext)

    return (
        <h1>Settings</h1>
    )
}

export default AcademyProfile