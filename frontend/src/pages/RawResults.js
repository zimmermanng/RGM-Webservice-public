import { useEffect, useState } from "react";
import struktur from "../components/data/struktur.json";
import { API_BASE } from "../config.ts";
import SurveyResultPage from "./SurveyResultPage";


const RawResults = () => {
  const [surveyResults, setSurveyResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [resultsRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE}/session/results`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/session/settings`, {
            credentials: "include",
          }),
        ]);

        if (!resultsRes.ok) {
          throw new Error(
            `Ergebnisse konnten nicht geladen werden (${resultsRes.status})`
          );
        }

        if (!settingsRes.ok) {
          throw new Error(
            `Einstellungen konnten nicht geladen werden (${settingsRes.status})`
          );
        }

        const resultsData = await resultsRes.json();
        const settingsData = await settingsRes.json();

        const normalizedEntries = normalizeResponseToEntries(resultsData);

        const activeIds = Array.isArray(settingsData.activeDimensions)
          ? settingsData.activeDimensions
          : [];

        const idToName = struktur.dimensionen.reduce((acc, d) => {
          acc[d.id] = d.name;
          return acc;
        }, {});

        const activeNames = activeIds.map((id) => idToName[id]).filter(Boolean);

        const filteredEntries =
          activeNames.length === 0
            ? normalizedEntries
            : normalizedEntries.map((entry) => ({
                ...entry,
                results: (entry.results || []).filter((r) =>
                  activeNames.includes(r.group)
                ),
                selections: (entry.selections || []).filter((s) =>
                  activeNames.includes(s.group)
                ),
              }));

        const combined = combineEntries(filteredEntries);

        if (combined?.results?.length > 0) {
          setSurveyResults({
            ...combined,
            team: resultsData?.team || combined?.team || null,
          });
        } else {
          setSurveyResults(null);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Session-Daten:", err);
        setError("Ergebnisse konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return <p role="status" aria-live="polite">Ergebnisse werden geladen …</p>;
  }
  if (error) {
    return <p className="access-error" role="alert">{error}</p>;
  }
  if (!surveyResults) {
    return <p className="noResults" role="status">Noch keine Ergebnisse vorhanden.</p>;
  }

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
    (Array.isArray(entry?.results) ? entry.results : []).forEach((row) => {
      const key = `${row.group}__${row.category}`;
      resultsByKey.set(key, row);
    });

    (Array.isArray(entry?.selections) ? entry.selections : []).forEach(
      (selection) => {
        const key = selection.frageId;
        selectionsByQuestionId.set(key, selection);
      }
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
