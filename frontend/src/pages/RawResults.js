import React, { useEffect, useState } from "react";
import SurveyResultPage from "./SurveyResultPage";
import struktur from "../components/data/struktur.json";

const API_BASE = "http://localhost:3011";

/**
 * RawResults
 *
 * Purpose of this version:
 * - Accept different backend response shapes.
 * - Merge multiple saved result entries into one combined result object.
 * - Keep the newest answer per question if multiple submissions exist.
 *
 * Why this matters for multi-package flows:
 * Even if the backend currently stores multiple POST submissions separately,
 * the result page should still be able to show one coherent overall picture.
 */
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
        if (!res.ok)
          throw new Error(`Server antwortete mit Status ${res.status}`);

        const data = await res.json();

        // 1️⃣ Backend-Antwort normalisieren
        const normalizedEntries = normalizeResponseToEntries(data);

        // 2️⃣ Aktive Pakete aus localStorage holen
        const stored = localStorage.getItem("activeDimensions");
        const activeIds = stored ? JSON.parse(stored) : [];
        const idToName = struktur.dimensionen.reduce((acc, d) => {
          acc[d.id] = d.name;
          return acc;
        }, {});
        const activeNames = activeIds.map((id) => idToName[id]);

        // 3️⃣ Nur aktive Pakete behalten
        const filteredEntries = normalizedEntries.map((entry) => ({
          ...entry,
          results: (entry.results || []).filter((r) =>
            activeNames.includes(r.group),
          ),
          selections: (entry.selections || []).filter((s) =>
            activeNames.includes(s.group),
          ),
        }));

        // 4️⃣ Einträge kombinieren (neueste Antworten pro Frage)
        const combined = combineEntries(filteredEntries);

        setSurveyResults(combined);
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

function normalizeResponseToEntries(data) {
  if (Array.isArray(data?.results)) {
    return data.results.map((entry) => entry?.data ?? entry).filter(Boolean);
  }
  if (Array.isArray(data)) {
    return data.map((entry) => entry?.data ?? entry).filter(Boolean);
  }
  if (data?.data) {
    return [data.data].filter(Boolean);
  }
  return data ? [data] : [];
}

function combineEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const sortedEntries = [...entries].sort((a, b) => {
    const ta = new Date(a?.timestamp || a?.savedAt || 0).getTime();
    const tb = new Date(b?.timestamp || b?.savedAt || 0).getTime();
    return ta - tb;
  });

  const resultsByKey = new Map();
  const selectionsByQuestionId = new Map();
  const allComments = [];

  sortedEntries.forEach((entry) => {
    (Array.isArray(entry?.results) ? entry.results : []).forEach(
      (row, index) => {
        const key = `${row.group}__${row.category}`; // index weglassen
        resultsByKey.set(key, row);
      },
    );

    (Array.isArray(entry?.selections) ? entry.selections : []).forEach(
      (selection, index) => {
        const key = selection.frageId; // frageId reicht als eindeutiger Schlüssel
        selectionsByQuestionId.set(key, selection);
      },
    );

    if (Array.isArray(entry?.comments) && entry.comments.length > 0) {
      allComments.push(...entry.comments);
    }
  });

  const latest = sortedEntries[sortedEntries.length - 1] || null;

  return {
    ...latest,
    results: Array.from(resultsByKey.values()),
    selections: Array.from(selectionsByQuestionId.values()),
    comments: allComments,
    timestamp: latest?.timestamp || latest?.savedAt || new Date().toISOString(),
  };
}

export default RawResults;
