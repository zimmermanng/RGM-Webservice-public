import React from "react";
import data from "../components/data/struktur.json";
import Card_dimensions from "../components/Cards/Card_dimensions";

const readJsonFromStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn(`Konnte ${key} nicht aus localStorage lesen:`, error);
    return fallback;
  }
};

const DimensionsPage = () => {
  const activeIds = readJsonFromStorage("activeDimensions", null);
  const storedAnswers = readJsonFromStorage("answers", {});

  const dimensionen = Array.isArray(activeIds)
    ? data.dimensionen.filter((d) => activeIds.includes(d.id))
    : data.dimensionen;

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
    </div>
  );
};

export default DimensionsPage;
