import React, { useEffect, useState } from "react";
import SurveyResultPage from "./SurveyResultPage";

const API_BASE = "http://localhost:3011";

const RawResults = () => {
  const [surveyResults, setSurveyResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`${API_BASE}/session/results`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Server antwortete mit Status ${res.status}`);
        }

        const data = await res.json();
        console.log("GET /session/results:", data);

        let latest = null;

        if (Array.isArray(data?.results) && data.results.length > 0) {
          latest = [...data.results].sort((a, b) => {
            const ta = new Date(a?.timestamp || a?.savedAt || 0).getTime();
            const tb = new Date(b?.timestamp || b?.savedAt || 0).getTime();
            return tb - ta;
          })[0];
        }

        console.log("Resolved surveyResults for page:", latest);
        console.log("Resolved selections:", latest?.selections);

        setSurveyResults(latest);
      } catch (err) {
        console.error("Fehler beim Laden der Session-Daten:", err);
        setError("Ergebnisse konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) return <p>Lade Ergebnisse...</p>;
  if (error) return <p>{error}</p>;
  if (!surveyResults) return <p>Noch keine Ergebnisse vorhanden.</p>;

  return <SurveyResultPage surveyResults={surveyResults} />;
};

export default RawResults;