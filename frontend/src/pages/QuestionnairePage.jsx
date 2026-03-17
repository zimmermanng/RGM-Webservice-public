import React, { useState, useMemo } from "react";
import struktur from "../components/data/struktur.json";
import fragen from "../components/data/fragen.json";
import handlEmpf from "../components/data/handlungsempfehlungen.json";
import { useParams, useNavigate } from "react-router-dom";
import {
  answersToResultsWithRecommendations,
  setDebug,
} from "../services/questionnaireToResults";
import CommentBox from "./CommentFunction";

// /api für den Server
const API_BASE = "http://localhost:3011";

export default function QuestionnairePage({ onUpload, activeCompany }) {
  const { dimensionId, handlungsfeldId } = useParams();
  const navigate = useNavigate();

  // Antworten pro Handlungsfeld speichern
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [postedComments, setPostedComments] = useState([]);
  const [inputs, setInputs] = useState({ user: "", text: "" });
  const currentDimension = struktur.dimensionen.find(
    (d) => d.id === dimensionId,
  );
  const handlungsfelder = currentDimension?.handlungsfelder || [];

  // Index des aktuellen HF
  const currentHFIndex = handlungsfelder.findIndex(
    (h) => h.id === handlungsfeldId,
  );
  const currentHandlungsfeld = handlungsfelder[currentHFIndex];
  const comments = activeCompany === "Shuffle";
  // Filter Fragen für dieses HF
  const filteredFragen = useMemo(() => {
    if (!currentHandlungsfeld) return [];
    return currentHandlungsfeld.fragen
      .map((ref) => fragen.fragen.find((f) => f.id === ref.id))
      .filter(Boolean);
  }, [currentHandlungsfeld]);

  if (!currentDimension || !currentHandlungsfeld) {
    return <p>Handlungsfeld nicht gefunden.</p>;
  }

  // Antworten merken
  // Antworten merken
  const handleAnswerClick = (frage, antwort) => {
    setSelectedAnswers((prev) => {
      const newAnswersForHF = {
        ...prev,
        [frage.id]: {
          frageId: frage.id,
          frageText: frage.frage,
          antwortId: antwort.id,
          antwortText: antwort.antwort,
          stufe: antwort.stufe,
          group: currentDimension.name,
          category: currentHandlungsfeld.name,
          dimensionId,
          handlungsfeldId,
        },
      };

      // 🔹 alle Antworten der Dimension im localStorage speichern
      const allAnswers = JSON.parse(localStorage.getItem("answers") || "{}");
      allAnswers[dimensionId] = {
        ...allAnswers[dimensionId], // alte Antworten behalten
        ...newAnswersForHF, // neue/aktualisierte hinzufügen
      };
      localStorage.setItem("answers", JSON.stringify(allAnswers));

      return newAnswersForHF;
    });
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

  const buildCommentsExport = () => ({
    dimensionId,
    handlungsfeldId,
    dimensionName: currentDimension?.name || "",
    handlungsfeldName: currentHandlungsfeld?.name || "",
    timestamp: new Date().toISOString(),
    comments: postedComments,
  });

 const handleSubmit = async () => {
  const payload = {
    dimensionId,
    handlungsfeldId,
    timestamp: new Date().toISOString(),
    results: resultRowsForCurrentState(),
    selections: Object.values(selectedAnswers),
    comments: postedComments,
  };

  console.log("Submitting payload:", payload);

  try {
    const response = await fetch(`${API_BASE}/session/results`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      alert("Ihre Sitzung ist nicht mehr gültig. Bitte erneut einloggen.");
      navigate("/login");
      return;
    }

    if (response.status === 403) {
      alert("Bitte zuerst ein Team auswählen.");
      navigate("/team-select");
      return;
    }

    if (!response.ok) {
      throw new Error(`Server antwortete mit Status ${response.status}`);
    }

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
        handlungsfeldId,
        timestamp: new Date().toISOString(),
        results,
        selections: Object.values(selectedAnswers),
      },
      `results_${dimensionId}_${handlungsfeldId}_${ts}.json`,
    );

    downloadJSON(
      commentsExport,
      `comments_${dimensionId}_${handlungsfeldId}_${ts}.json`,
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

  // Navigation Funktionen
  const navigateToHandlungsfeld = (index) => {
    if (index < 0 || index >= handlungsfelder.length) return;
    const nextHF = handlungsfelder[index];
    navigate(`/questionnaire/${dimensionId}/${nextHF.id}`);
  };

  const handleNext = () => navigateToHandlungsfeld(currentHFIndex + 1);
  const handlePrev = () => navigateToHandlungsfeld(currentHFIndex - 1);

  return (
    <div className="mainContainer" id="top">
      <div className="top-buttons">
        <button onClick={() => navigate("/dimensions")}>
          ← Zurück zur Übersicht
        </button>
      </div>
      <div className="questions-container">
        <h1>{currentDimension?.name}</h1>
        <h2>{currentHandlungsfeld?.name}</h2>
        {filteredFragen.length === 0 ? (
          <p>Keine Fragen für dieses Handlungsfeld gefunden.</p>
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
                      key={`${frage.id}-${antwort.id || "none"}`}
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

        {comments && (
          <CommentBox
            inputs={inputs}
            comments={postedComments}
            onInputChange={handleInputChange}
            onPost={handlePost}
          />
        )}

        {/* Handlungsfeld Navigation */}
        <div className="hf-navigation">
          <button
            onClick={handlePrev}
            disabled={currentHFIndex === 0}
            className="nav-button"
          >
            Zurück
          </button>
          <span>
            {currentHFIndex + 1} / {handlungsfelder.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentHFIndex === handlungsfelder.length - 1}
            className="nav-button"
          >
            Weiter
          </button>
        </div>

        {/* Auswertung / Download Buttons */}
        <div className="submit-buttons">
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