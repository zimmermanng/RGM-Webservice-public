import { createContext, useEffect, useState } from "react";
import { API_BASE } from "../config.ts";

export const TeamsContext = createContext(null);

const sortTeamsAlphabetically = (teams) => {
    teams.sort((a, b) => {
        const nameA = a.formattedName.toUpperCase();
        const nameB = b.formattedName.toUpperCase();

        if (nameA === "ADMINISTRATION") return 1
        if (nameB === "ADMINISTRATION") return -1

        return nameA.localeCompare(nameB, "de", {
            sensitivity: "base",
            numeric: true,
        })
    });
    return teams;
}

export function TeamsProvider({ children }) {
    const [selectableTeams, setSelectableTeams] = useState([]);
    const [loadingSelectableTeams, setLoadingSelectableTeams] = useState(true);
    const [successfullyLoaded, setSuccessfullyLoaded] = useState(true);
    
    const fetchSelectableTeams = async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/selectable-teams`, {
                credentials: "include",
            });
            const data = await res.json();
            let fetchedTeams = data.teams;
            sortTeamsAlphabetically(fetchedTeams);
            setSelectableTeams(fetchedTeams);
        } catch (err) {
            setSuccessfullyLoaded(false);
            console.error("Fehler beim Laden der Teamstruktur:", err);
        } finally {
            setLoadingSelectableTeams(false)
        }
    };
    
    useEffect(() => {
        fetchSelectableTeams()
    }, []);

    return (
        <TeamsContext.Provider value={{ selectableTeams, loadingSelectableTeams, successfullyLoaded, fetchSelectableTeams }}>
            {children}
        </TeamsContext.Provider>
    );
};