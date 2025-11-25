// src/pages/QuestionnairePage.jsx
import React, { useState, useMemo } from "react";
import "./QuestionnairePage.css";
import struktur from "../components/data/struktur.json";
import fragen from "../components/data/fragen.json";
import handlEmpf from "../components/data/handlungsempfehlungen.json";
import { useParams, useNavigate } from "react-router-dom";
import { answersToResultsWithRecommendations, setDebug } from "../services/questionnaireToResults";
import CommentBox from "./CommentFunction";

export default function QuestionnairePage({ onUpload }) {
  const { dimensionId } = useParams();
  const navigate = useNavigate();

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [postedComments, setPostedComments] = useState({});
  const [inputs, setInputs] = useState({});

  const frageIdsForDimension = useMemo(() => {
    const dimension = struktur.dimensionen.find((d) => d.id === dimensionId);
    if (!dimension) return [];
    return dimension.handlungsfelder.flatMap((hf) =>
      (hf.fragen || []).map((f) => f.id)
    );
  }, [dimensionId]);

  const filteredFragen = useMemo(() => {
    return (fragen.fragen || []).filter((f) =>
      frageIdsForDimension.includes(f.id)
    );
  }, [frageIdsForDimension]);

  const currentDimension = struktur.dimensionen.find(
    (d) => d.id === dimensionId
  );

  const handleAnswerClick = (frage, antwort) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [frage.id]: {
        frageId: frage.id,
        frageText: frage.frage,
        antwortId: antwort.id,
        antwortText: antwort.antwort,
        stufe: antwort.stufe,
      },
    }));
  };

  setDebug(true);

  const resultRowsForCurrentState = () =>
    answersToResultsWithRecommendations({
      selectedAnswers,
      struktur,
      fragen,
      handlEmpf,
      dimensionId,
    });

  const buildCommentsExport = () => {
    return Object.entries(postedComments).map(([frageId, comments]) => {
      const frage = fragen.fragen.find((f) => f.id === frageId);

      return {
        frageId,
        frageText: frage?.frage || "",
        comments: comments.map((c) => ({
          user: c.user,
          text: c.text
        }))
      };
    });
  };

  const handleSubmit = () => {
    const results = resultRowsForCurrentState();
    const comments = buildCommentsExport();

    const payload = {
      dimensionId,
      timestamp: new Date().toISOString(),
      results,
      comments
    };

    if (typeof onUpload === "function") {
      onUpload(payload);
      navigate("/results");
    } else {
      console.log("Questionnaire → Payload:", payload);
      alert("Antworten und Kommentare verarbeitet.");
    }
  };

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
  const results = resultRowsForCurrentState();
  const comments = buildCommentsExport();

  const ts = new Date().toISOString().replace(/[:.]/g, "-");

  // Datei 1: Ergebnisse
  downloadJSON(
    {
      dimensionId,
      timestamp: new Date().toISOString(),
      results
    },
    `results_${dimensionId}_${ts}.json`
  );

  // Datei 2: Kommentare
  downloadJSON(
    {
      dimensionId,
      timestamp: new Date().toISOString(),
      comments
    },
    `comments_${dimensionId}_${ts}.json`
  );
};


  const allQuestionIds = filteredFragen.map((f) => f.id);
  const allAnswered = allQuestionIds.every((id) => !!selectedAnswers[id]);
  const anyAnswered = Object.keys(selectedAnswers).length > 0;

  const handleInputChange = (frageId, field, value) => {
    setInputs((prev) => ({
      ...prev,
      [frageId]: { ...prev[frageId], [field]: value },
    }));
  };

  const handlePost = (frageId) => {
    const entry = inputs[frageId];
    if (!entry?.user || !entry?.text) return;

    setPostedComments((prev) => ({
      ...prev,
      [frageId]: [...(prev[frageId] || []), entry],
    }));

    setInputs((prev) => ({
      ...prev,
      [frageId]: { user: "", text: "" },
    }));
  };

  return (
    <div className="mainContainer" id="top">
      <div className="questions-container">
        <h1>{currentDimension?.name || "Unbekannte Dimension"}</h1>

        {filteredFragen.length === 0 ? (
          <p>Keine Fragen für diese Dimension gefunden.</p>
        ) : (
          filteredFragen.map((frage) => (
            <div key={frage.id} className="question-box">
              <p className="question-text">{frage.frage}</p>

              <div className="answers">
                {[
                  ...(frage.antworten || []),
                  { id: "", antwort: "Keine Angabe", stufe: -1, frage: frage.frage },
                ].map((antwort) => {
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

              <CommentBox
                frageId={frage.id}
                inputs={inputs[frage.id]}
                comments={postedComments[frage.id]}
                onInputChange={handleInputChange}
                onPost={handlePost}
              />
            </div>
          ))
        )}

        <div>
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={!allAnswered}
          >
            Auswerten & anzeigen
          </button>

          <button
            className="submit-button"
            onClick={handleDownload}
            disabled={!anyAnswered}
          >
            JSON herunterladen (Debug)
          </button>
        </div>
      </div>
    </div>
  );
}

