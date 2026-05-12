import React, { useEffect, useState } from "react";
import SurveyResultPage from "./SurveyResultPage";

const API_BASE = "http://localhost:3011";
const RESULTS_STORAGE_KEY = "shuffleResults";

/**
 * RawResults
 *
 * Loads saved questionnaire results from the backend when available.
 * If the backend is unavailable or returns no usable data, it uses the latest
 * locally saved result. It should not block the results page because of old
 * login/session errors.
 */
const RawResults = () => {
  const [surveyResults, setSurveyResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const localResults = readLocalResults();

      try {
        const res = await fetch(`${API_BASE}/session/results`);

        if (!res.ok) {
          throw new Error(`Server antwortete mit Status ${res.status}`);
        }

        const data = await res.json();
        console.log("GET /session/results:", data);

        const normalizedEntries = normalizeResponseToEntries(data);
        const combined = combineEntries(normalizedEntries);

        if (combined) {
          setSurveyResults(combined);
          return;
        }

        setSurveyResults(localResults);
      } catch (err) {
        console.warn("Backend-Ergebnisse konnten nicht geladen werden:", err);
        setSurveyResults(localResults);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="mainContainer" id="top">
        <p>Lade Ergebnisse...</p>
      </div>
    );
  }

  if (!surveyResults) {
    return (
      <div className="mainContainer" id="top">
        <p>Noch keine Ergebnisse vorhanden.</p>
      </div>
    );
  }

  return <SurveyResultPage surveyResults={surveyResults} />;
};

function readLocalResults() {
  try {
    const raw = localStorage.getItem(RESULTS_STORAGE_KEY);
    const parsed = JSON.parse(raw || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.error("Lokale Ergebnisse konnten nicht gelesen werden:", error);
    return null;
  }
}

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
