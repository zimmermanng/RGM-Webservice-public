import React from "react";
import { useNavigate } from "react-router-dom";
import data from "../components/data/struktur.json";
import fragen from "../components/data/fragen.json";
import handlEmpf from "../components/data/handlungsempfehlungen.json";
import Card_dimensions from "../components/Cards/Card_dimensions";
import { answersToResultsWithRecommendations } from "../services/questionnaireToResults";

const ANSWERS_STORAGE_KEY = "answers";
const RESULTS_STORAGE_KEY = "shuffleResults";

const readJsonFromStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn(`Konnte ${key} nicht aus localStorage lesen:`, error);
    return fallback;
  }
};

const writeJsonToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Konnte ${key} nicht in localStorage speichern:`, error);
  }
};

const flattenSelections = (allAnswersByDimension) =>
  Object.values(allAnswersByDimension || {})
    .flatMap((dimensionAnswers) => Object.values(dimensionAnswers || {}))
    .filter(Boolean);

const buildAggregatedResults = (allAnswersByDimension) => {
  const mergedRows = new Map();

  Object.entries(allAnswersByDimension || {}).forEach(([dimensionId, answersForDimension]) => {
    if (!answersForDimension || Object.keys(answersForDimension).length === 0) {
      return;
    }

    const rows = answersToResultsWithRecommendations({
      selectedAnswers: answersForDimension,
      struktur: data,
      fragen,
      handlEmpf,
      dimensionId,
    });

    (Array.isArray(rows) ? rows : []).forEach((row, index) => {
      const key =
        row?.id || `${row?.group || "group"}__${row?.category || "category"}__${index}`;
      mergedRows.set(key, row);
    });
  });

  return Array.from(mergedRows.values());
};

const DimensionsPage = () => {
  const navigate = useNavigate();
  const activeIds = readJsonFromStorage("activeDimensions", null);
  const storedAnswers = readJsonFromStorage(ANSWERS_STORAGE_KEY, {});

  const dimensionen = Array.isArray(activeIds)
    ? data.dimensionen.filter((d) => activeIds.includes(d.id))
    : data.dimensionen;

  const handleShowResults = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      results: buildAggregatedResults(storedAnswers),
      selections: flattenSelections(storedAnswers),
      comments: [],
    };

    writeJsonToStorage(RESULTS_STORAGE_KEY, payload);

    navigate("/rawresults");
  };

  return (
    <div className="mainContainer dimensionsPage" aria-labelledby="dimensions-title">
      <div className="dimensionsIntro">
        <h1 id="dimensions-title">Fragebogen</h1>
        <p id="dimensions-description">
          Hier können Sie die Selbstbewertung bequem online vornehmen.<br />
          Beantworten Sie die Fragen jeweils durch Auswahl der passenden Antwortoption.
        </p>
      </div>

      <div
        className="gridContainer dimensionsGrid"
        role="list"
        aria-describedby="dimensions-description"
      >
        {dimensionen.map((dimension) => {
          const answeredObj = storedAnswers[dimension.id] || {};
          const answeredCount = Object.keys(answeredObj).length;

          const totalQuestions = dimension.handlungsfelder.reduce(
            (sum, hf) => sum + (hf.fragen?.length || 0),
            0
          );

          const progress = totalQuestions > 0 ? answeredCount / totalQuestions : 0;

          return (
            <div key={dimension.id} className="gridItem" role="listitem">
              <Card_dimensions
                title={dimension.name}
                dimensionId={dimension.id}
                handlungsfelder={dimension.handlungsfelder}
                progress={progress}
              />
            </div>
          );
        })}
      </div>

      <div className="dimensionsActions">
        <button type="button" className="homeButton dimensionsResultsButton" onClick={handleShowResults}>
          Auswertung
        </button>
      </div>
    </div>
  );
};

export default DimensionsPage;
