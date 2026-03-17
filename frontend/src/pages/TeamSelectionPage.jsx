import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const DEFAULT_TEAMS = [
  "Team A",
  "Team B",
  "Team C",
];

const TeamSelectionPage = ({ teams = DEFAULT_TEAMS, onTeamSelected }) => {
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedTeam) {
      setError("Bitte ein Team auswählen");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3011/auth/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ team: selectedTeam }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Team konnte nicht gespeichert werden");
        return;
      }

      if (onTeamSelected) {
        onTeamSelected(selectedTeam);
      }

      navigate("/start");
    } catch (err) {
      setError("Backend nicht erreichbar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="access-page">
      <div className="access-card">
        <h1 className="access-title">Team auswählen</h1>
        <p className="access-subtitle">
          Bitte wählen Sie Ihr Team aus, bevor Sie den Webservice betreten.
        </p>

        <select
          className="access-input"
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <option value="">Bitte auswählen</option>
          {teams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>

        {error && <div className="access-error">{error}</div>}

        <button
          type="button"
          className="access-button"
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? "Speichern..." : "Weiter zum Webservice"}
        </button>
      </div>
    </div>
  );
};

export default TeamSelectionPage;