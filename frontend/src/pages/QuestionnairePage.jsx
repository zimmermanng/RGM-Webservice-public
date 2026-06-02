import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import struktur from "../components/data/struktur.json";
import fragen from "../components/data/fragen.json";

const ANSWERS_STORAGE_KEY = "answers";

export default function QuestionnairePage() {
  const { dimensionId, handlungsfeldId } = useParams();
  const navigate = useNavigate();

  const [selectedAnswers, setSelectedAnswers] = useState({});

  const currentDimension = struktur.dimensionen.find((d) => d.id === dimensionId);
  const handlungsfelder = currentDimension?.handlungsfelder || [];
  const currentHFIndex = handlungsfelder.findIndex((h) => h.id === handlungsfeldId);
  const currentHandlungsfeld = handlungsfelder[currentHFIndex];

  const filteredFragen = useMemo(() => {
    if (!currentHandlungsfeld) return [];

    return currentHandlungsfeld.fragen
      .map((ref) => fragen.fragen.find((f) => f.id === ref.id))
      .filter(Boolean);
  }, [currentHandlungsfeld]);

  function readStoredAnswers() {
    try {
      const raw = localStorage.getItem(ANSWERS_STORAGE_KEY);
      const parsed = JSON.parse(raw || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.warn("Konnte localStorage answers nicht lesen:", error);
      return {};
    }
  }

  function writeStoredAnswers(allAnswers) {
    localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(allAnswers));
  }

  useEffect(() => {
    const allStoredAnswers = readStoredAnswers();
    setSelectedAnswers(allStoredAnswers[dimensionId] || {});
  }, [dimensionId, handlungsfeldId]);

  if (!currentDimension || !currentHandlungsfeld) {
    return <p>Handlungsfeld nicht gefunden.</p>;
  }

  const handleAnswerClick = (frage, antwort) => {
    const nextSelection = {
      frageId: frage.id,
      frageText: frage.frage,
      antwortId: antwort.id,
      antwortText: antwort.antwort,
      stufe: antwort.stufe,
      group: currentDimension.name,
      category: currentHandlungsfeld.name,
      dimensionId,
      handlungsfeldId,
    };

    setSelectedAnswers((prev) => {
      const nextAnswersForDimension = {
        ...prev,
        [frage.id]: nextSelection,
      };

      const allStoredAnswers = readStoredAnswers();
      allStoredAnswers[dimensionId] = {
        ...(allStoredAnswers[dimensionId] || {}),
        [frage.id]: nextSelection,
      };
      writeStoredAnswers(allStoredAnswers);

      return nextAnswersForDimension;
    });
  };

  const navigateToHandlungsfeld = (index) => {
    if (index < 0 || index >= handlungsfelder.length) return;
    const nextHF = handlungsfelder[index];
    navigate(`/questionnaire/${dimensionId}/${nextHF.id}`);
  };

  const handleNext = () => navigateToHandlungsfeld(currentHFIndex + 1);
  const handlePrev = () => navigateToHandlungsfeld(currentHFIndex - 1);

  return (
    <div className="mainContainer questionnaire-page" id="top">
      <div className="top-buttons">
        <button type="button" onClick={() => navigate("/dimensions")}>
          ← Zurück zur Übersicht
        </button>
      </div>

      <div className="questions-container">
        <div className="questionnaire-header">
          <h1>{currentDimension?.name}</h1>
          <h2>{currentHandlungsfeld?.name}</h2>
        </div>

        {filteredFragen.length === 0 ? (
          <p>Keine Fragen für dieses Handlungsfeld gefunden.</p>
        ) : (
          <ol className="question-list">
            {filteredFragen.map((frage) => (
              <li key={frage.id} className="question-list-item">
                <section className="question-box" aria-labelledby={`question-${frage.id}`}>
                  <h3 id={`question-${frage.id}`} className="question-text">
                    {frage.frage}
                  </h3>

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
                      const isSelected = selectedAnswers[frage.id]?.antwortId === antwort.id;

                      return (
                        <button
                          type="button"
                          key={`${frage.id}-${antwort.id || "none"}`}
                          className={`answer-button ${isSelected ? "selected" : ""}`}
                          aria-pressed={isSelected}
                          onClick={() => handleAnswerClick(frage, antwort)}
                        >
                          {antwort.antwort}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </li>
            ))}
          </ol>
        )}

        <div className="hf-navigation">
          <button
            type="button"
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
            type="button"
            onClick={handleNext}
            disabled={currentHFIndex === handlungsfelder.length - 1}
            className="nav-button"
          >
            Weiter
          </button>
        </div>

        <div className="submit-buttons">
          <button
            type="button"
            className="submit-button"
            onClick={() => navigate("/dimensions")}
          >
            ← Zurück zur Übersicht
          </button>
        </div>
      </div>
    </div>
  );
}
