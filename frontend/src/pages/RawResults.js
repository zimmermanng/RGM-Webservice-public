import React, { useEffect, useState } from "react";
import SurveyResultPage from "./SurveyResultPage";

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

        if (!res.ok) {
          throw new Error(`Server antwortete mit Status ${res.status}`);
        }

        const data = await res.json();
        console.log("GET /session/results:", data);

        const normalizedEntries = normalizeResponseToEntries(data);
        const combined = combineEntries(normalizedEntries);

        console.log("Resolved combined surveyResults for page:", combined);
        console.log("Resolved combined selections:", combined?.selections);

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
    (Array.isArray(entry?.results) ? entry.results : []).forEach((row, index) => {
      const key =
        row?.id || `${row?.group || "group"}__${row?.category || "category"}__${index}`;
      resultsByKey.set(key, row);
    });

    (Array.isArray(entry?.selections) ? entry.selections : []).forEach((selection, index) => {
      const key =
        selection?.frageId ||
        `${selection?.group || "group"}__${selection?.category || "category"}__${index}`;
      selectionsByQuestionId.set(key, selection);
    });

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