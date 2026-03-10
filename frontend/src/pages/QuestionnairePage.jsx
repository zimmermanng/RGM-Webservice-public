import React, { useState, useMemo } from "react";
import "./QuestionnairePage.css";
import struktur from "../components/data/struktur.json";
import fragen from "../components/data/fragen.json";
import handlEmpf from "../components/data/handlungsempfehlungen.json";
import { useParams, useNavigate } from "react-router-dom";
import {
  answersToResultsWithRecommendations,
  setDebug,
} from "../services/questionnaireToResults";
import CommentBox from "./CommentFunction";

export default function QuestionnairePage({ onUpload }) {
  const { dimensionId, handlungsfeldId } = useParams();
  const navigate = useNavigate();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [postedComments, setPostedComments] = useState([]);
  const [inputs, setInputs] = useState({ user: "", text: "" });

  const currentDimension = struktur.dimensionen.find(
    (d) => d.id === dimensionId
  );

  const currentHandlungsfeld = currentDimension?.handlungsfelder.find(
    (h) => h.id === handlungsfeldId
  );

  const filteredFragen = useMemo(() => {
    if (!currentHandlungsfeld) return [];

    return currentHandlungsfeld.fragen
      .map((ref) => fragen.fragen.find((f) => f.id === ref.id))
      .filter(Boolean);
  }, [currentHandlungsfeld]);

  if (!currentDimension || !currentHandlungsfeld) {
    return <p>Handlungsfeld nicht gefunden.</p>;
  }

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
    return {
        frageId,
        frageText: frage?.frage || "",
      comments: postedComments,
    };
  };

  const handleSubmit = async () => {
    const payload = {
      timestamp: new Date().toISOString(),
      results: resultRowsForCurrentState(),
      comments: postedComments,
    };

    try {
      const response = await fetch(`${API_BASE}/session/results`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });


      const data = await response.json();
      console.log("Backend-Antwort:", data);
      navigate("/rawresults");
    } catch (err) {
      console.error("Fehler beim Senden:", err);
      alert("Backend nicht erreichbar oder Fehler beim Senden");
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
    const commentsExport = buildCommentsExport();
    const ts = new Date().toISOString().replace(/[:.]/g, "-");

    downloadJSON(
      {
        dimensionId,
        timestamp: new Date().toISOString(),
        results,
      },
      `results_${dimensionId}_${handlungsfeldId}_${ts}.json`
    );

    downloadJSON(
      commentsExport,
      `comments_${dimensionId}_${handlungsfeldId}_${ts}.json`
    );
  };

  const allQuestionIds = filteredFragen.map((f) => f.id);
  const allAnswered = allQuestionIds.every((id) => !!selectedAnswers[id]);
  const anyAnswered = Object.keys(selectedAnswers).length > 0;

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handlePost = () => {
    if (!inputs.user || !inputs.text) return;

    setPostedComments((prev) => [...prev, inputs]);
    setInputs({ user: "", text: "" });
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
                  {
                    id: "",
                    antwort: "Keine Angabe",
                    stufe: -1,
                    frage: frage.frage,
                  },
                ].map((antwort) => {
                  const isSelected =
                    selectedAnswers[frage.id]?.antwortId === antwort.id;

                  return (
                    <button
                      key={antwort.id}
                      className={`answer-button ${
                        isSelected ? "selected" : ""
                      }`}
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

        <h2>Kommentare</h2>
        <CommentBox
          inputs={inputs}
          comments={postedComments}
          onInputChange={handleInputChange}
          onPost={handlePost}
        />

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