// src/pages/QuestionnairePage.jsx
import React, { useState, useMemo } from "react";
import "./QuestionnairePage.css";
import struktur from "../components/data/struktur.json";
import fragen from "../components/data/fragen.json";
import handlEmpf from "../components/data/handlungsempfehlungen.json";
import { useParams, useNavigate } from "react-router-dom";
import { answersToResultsWithRecommendations } from "../services/questionnaireToResults";
import { setDebug } from "../services/questionnaireToResults";

export default function QuestionnairePage({ onUpload }) {
  const { dimensionId } = useParams();
  const navigate = useNavigate();
  const [selectedAnswers, setSelectedAnswers] = useState({});


  // Collect all frageIds that belong to the current dimension
  const frageIdsForDimension = useMemo(() => {
    const dimension = struktur.dimensionen.find((d) => d.id === dimensionId);
    if (!dimension) return [];
    return dimension.handlungsfelder.flatMap((hf) =>
      (hf.fragen || []).map((f) => f.id)
    );
  }, [dimensionId]);

  // Filter the global fragen list to only those for this dimension
  const filteredFragen = useMemo(() => {
    return (fragen.fragen || []).filter((f) =>
      frageIdsForDimension.includes(f.id)
    );
  }, [frageIdsForDimension]);

  const handleAnswerClick = (frage, antwort) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [frage.id]: {
        frageId: frage.id,
        frageText: frage.frage,
        antwortId: antwort.id,
        antwortText: antwort.antwort,
        stufe: antwort.stufe, // numeric 0..4
      },
    }));
  };

  setDebug(true);
  // Build ResultPage rows (with recommendations) from the current state
  const resultRowsForCurrentState = () =>
    answersToResultsWithRecommendations({
      selectedAnswers,
      struktur,
      fragen,
      handlEmpf,
      dimensionId,
    });

  const handleSubmit = () => {
    const resultRows = resultRowsForCurrentState();

    if (typeof onUpload === "function") {
      // keep parity with your UploadPage flow
      onUpload(resultRows); // [{ group, category, value, recommendations }]
      navigate("/results");
    } else {
      console.log("Questionnaire→Result rows:", resultRows);
      alert("Antworten verarbeitet. (Kein onUpload-Handler gefunden.)");
    }
  };

  // ---- Debug: download current results as JSON ----
  const downloadJSON = (data, filename = "results.json") => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    const rows = resultRowsForCurrentState();
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `results_${dimensionId || "unknown"}_${ts}.json`;
    downloadJSON(
      {
        dimensionId,
        timestamp: new Date().toISOString(),
        data: rows, // [{ group, category, value, recommendations }]
      },
      filename
    );
  };
  // -----------------------------------------------

  // Optional UX: require all questions answered before submit
  const allQuestionIds = filteredFragen.map((f) => f.id);
  const allAnswered = allQuestionIds.every((id) => !!selectedAnswers[id]);
  const anyAnswered = Object.keys(selectedAnswers).length > 0;

  const totalQuestions = filteredFragen.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="mainContainer" id="top">
      <div className="questions-container">
        <h2>Fragen & Antworten</h2>
          <div class="progress-container">
              <p>Fortschritt: {answeredCount} von {totalQuestions} beantwortet</p>
              <p>{Math.round(progress)}%</p>
          </div>
        {filteredFragen.length === 0 ? (
          <p>Keine Fragen für diese Dimension gefunden.</p>
        ) : (
          filteredFragen.map((frage) => (
            <div key={frage.id} className="question-box">
              <p className="question-text">{frage.frage}</p>
              <div className="answers">
                {(frage.antworten || []).map((antwort) => {
                  const isSelected =
                    selectedAnswers[frage.id]?.antwortId === antwort.id;
                  return (
                    <button
                      key={antwort.id}
                      className={`answer-button ${isSelected ? "selected" : ""}`}
                      onClick={() => handleAnswerClick(frage, antwort)}
                    >
                      {antwort.antwort}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={!allAnswered}
            title={allAnswered ? "" : "Bitte alle Fragen beantworten"}
          >
            Auswerten & anzeigen
          </button>

          <button
            className="submit-button"
            onClick={handleDownload}
            disabled={!anyAnswered}
            title={anyAnswered ? "" : "Bitte mindestens eine Antwort wählen"}
          >
            JSON herunterladen (Debug)
          </button>
        </div>
      </div>
    </div>
  );
}
