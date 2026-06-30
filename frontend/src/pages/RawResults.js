/**
 * Loads locally stored Shuffle questionnaire results for the detailed results page.
 * Results are filtered to active dimensions when the user previously limited
 * the questionnaire scope.
 */
import React, { useEffect, useState } from "react";
import SurveyResultPage from "./SurveyResultPage";
import struktur from "../components/data/struktur.json";

const ANSWERS_STORAGE_KEY = "answers";
const RESULTS_STORAGE_KEY = "shuffleResults";
const ACTIVE_DIMENSIONS_STORAGE_KEY = "activeDimensions";

const RawResults = () => {
  const [surveyResults, setSurveyResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSurveyResults(readLocalResults());
    setLoading(false);
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
    const answers = readJsonFromStorage(ANSWERS_STORAGE_KEY, {});

    if (!hasStoredAnswers(answers)) {
      localStorage.removeItem(RESULTS_STORAGE_KEY);
      return null;
    }

    const parsed = readJsonFromStorage(RESULTS_STORAGE_KEY, null);

    if (!isUsableResultPayload(parsed)) {
      return null;
    }

    return filterToActiveDimensions(parsed);
  } catch (error) {
    console.error("Lokale Ergebnisse konnten nicht gelesen werden:", error);
    return null;
  }
}

function readJsonFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Konnte ${key} nicht aus localStorage lesen:`, error);
    return fallback;
  }
}

function hasStoredAnswers(answers) {
  if (!answers || typeof answers !== "object") return false;

  return Object.values(answers).some(
    (dimensionAnswers) =>
      dimensionAnswers &&
      typeof dimensionAnswers === "object" &&
      Object.keys(dimensionAnswers).length > 0
  );
}

function isUsableResultPayload(payload) {
  return (
    payload &&
    typeof payload === "object" &&
    Array.isArray(payload.results) &&
    payload.results.length > 0 &&
    Array.isArray(payload.selections) &&
    payload.selections.length > 0
  );
}

function filterToActiveDimensions(payload) {
  const activeIds = readJsonFromStorage(ACTIVE_DIMENSIONS_STORAGE_KEY, null);

  if (!Array.isArray(activeIds) || activeIds.length === 0) {
    return payload;
  }

  const idToName = struktur.dimensionen.reduce((acc, dimension) => {
    acc[dimension.id] = dimension.name;
    return acc;
  }, {});

  const activeNames = activeIds.map((id) => idToName[id]).filter(Boolean);

  if (!activeNames.length) {
    return payload;
  }

  return {
    ...payload,
    results: (payload.results || []).filter((row) =>
      activeNames.includes(row?.group)
    ),
    selections: (payload.selections || []).filter((selection) =>
      activeNames.includes(selection?.group)
    ),
  };
}

export default RawResults;
