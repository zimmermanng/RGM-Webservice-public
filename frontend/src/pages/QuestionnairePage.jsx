import React, { useEffect, useMemo, useState } from "react";
import struktur from "../components/data/struktur.json";
import fragen from "../components/data/fragen.json";
import handlEmpf from "../components/data/handlungsempfehlungen.json";
import { useParams, useNavigate } from "react-router-dom";
import { answersToResultsWithRecommendations } from "../services/questionnaireToResults";

const API_BASE = "http://localhost:3011";
const ANSWERS_STORAGE_KEY = "answers";
const RESULTS_STORAGE_KEY = "shuffleResults";

export default function QuestionnairePage() {
  const { dimensionId, handlungsfeldId } = useParams();
  const navigate = useNavigate();

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [postedComments, setPostedComments] = useState([]);
  const [inputs, setInputs] = useState({ user: "", text: "" });

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

  function flattenSelections(allAnswersByDimension) {
    return Object.values(allAnswersByDimension)
      .flatMap((dimensionAnswers) => Object.values(dimensionAnswers || {}))
      .filter(Boolean);
  }

  function buildAggregatedResults(allAnswersByDimension) {
    const mergedRows = new Map();

    Object.entries(allAnswersByDimension).forEach(([dimId, answersForDimension]) => {
      if (!answersForDimension || Object.keys(answersForDimension).length === 0) {
        return;
      }

      const rows = answersToResultsWithRecommendations({
        selectedAnswers: answersForDimension,
        struktur,
        fragen,
        handlEmpf,
        dimensionId: dimId,
      });

      (Array.isArray(rows) ? rows : []).forEach((row, index) => {
        const key =
          row?.id || `${row?.group || "group"}__${row?.category || "category"}__${index}`;
        mergedRows.set(key, row);
      });
    });

    return Array.from(mergedRows.values());
  }

  useEffect(() => {
    const allStoredAnswers = readStoredAnswers();
    setSelectedAnswers(allStoredAnswers[dimensionId] || {});
  }, [dimensionId, handlungsfeldId]);

  if (!currentDimension || !currentHandlungsfeld) {
    return (
      <main className="mainContainer questionnaire-page" id="top">
        <p>Handlungsfeld nicht gefunden.</p>
      </main>
    );
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

  const buildFullPayload = () => {
    const allStoredAnswers = readStoredAnswers();

    allStoredAnswers[dimensionId] = {
      ...(allStoredAnswers[dimensionId] || {}),
      ...selectedAnswers,
    };

    const selections = flattenSelections(allStoredAnswers);
    const results = buildAggregatedResults(allStoredAnswers);

    return {
      dimensionId,
      handlungsfeldId,
      timestamp: new Date().toISOString(),
      results,
      selections,
      comments: postedComments,
    };
  };

  const handleSubmit = async () => {
    const payload = buildFullPayload();
    console.log("Submitting aggregated payload:", payload);

    try {
      localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("Konnte Ergebnisse nicht lokal speichern:", error);
    }

    try {
      const response = await fetch(`${API_BASE}/session/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server antwortete mit Status ${response.status}`);
      }

      const data = await response.json();
      console.log("Backend-Antwort:", data);
    } catch (error) {
      console.warn(
        "Backend nicht erreichbar. Ergebnisse wurden lokal gespeichert:",
        error
      );
    } finally {
      navigate("/rawresults");
    }
  };

  const allQuestionIds = filteredFragen.map((f) => f.id);
  const allAnswered = allQuestionIds.every((id) => !!selectedAnswers[id]);
  const handleInputChange = (field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handlePost = () => {
    if (!inputs.user || !inputs.text) return;
    setPostedComments((prev) => [...prev, inputs]);
    setInputs({ user: "", text: "" });
  };

  const navigateToHandlungsfeld = (index) => {
    if (index < 0 || index >= handlungsfelder.length) return;
    const nextHF = handlungsfelder[index];
    navigate(`/questionnaire/${dimensionId}/${nextHF.id}`);
  };

  const handleNext = () => navigateToHandlungsfeld(currentHFIndex + 1);
  const handlePrev = () => navigateToHandlungsfeld(currentHFIndex - 1);

  return (
    <main className="mainContainer questionnaire-page" id="top">
      <nav className="top-buttons" aria-label="Fragebogen-Navigation">
        <button type="button" onClick={() => navigate("/dimensions")}>← Zurück zur Übersicht</button>
      </nav>

      <section
        className="questions-container"
        aria-labelledby="questionnaire-title"
        aria-describedby="questionnaire-subtitle questionnaire-progress"
      >
        <header className="questionnaire-header">
          <h1 id="questionnaire-title">{currentDimension?.name}</h1>
          <h2 id="questionnaire-subtitle">{currentHandlungsfeld?.name}</h2>
          <p id="questionnaire-progress" className="progress-text">
            {currentHFIndex + 1} / {handlungsfelder.length}
          </p>
        </header>

        {filteredFragen.length === 0 ? (
          <p>Keine Fragen für dieses Handlungsfeld gefunden.</p>
        ) : (
          <ol className="question-list" aria-label="Fragen in diesem Handlungsfeld">
            {filteredFragen.map((frage, frageIndex) => {
              const questionTitleId = `question-${frage.id}-title`;

              return (
                <li key={frage.id} className="question-list-item">
                  <section className="question-box" aria-labelledby={questionTitleId}>
                    <h3 id={questionTitleId} className="question-text">
                      {frage.frage}
                    </h3>

                    <div className="answers" role="group" aria-labelledby={questionTitleId}>
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
                            key={`${frage.id}-${antwort.id || "none"}`}
                            type="button"
                            className={`answer-button ${isSelected ? "selected" : ""}`}
                            onClick={() => handleAnswerClick(frage, antwort)}
                            aria-pressed={isSelected}
                            aria-label={`Frage ${frageIndex + 1}: ${antwort.antwort}`}
                          >
                            {antwort.antwort}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </li>
              );
            })}
          </ol>
        )}

        <nav className="hf-navigation" aria-label="Handlungsfeld wechseln">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentHFIndex === 0}
            className="nav-button"
          >
            Zurück
          </button>

          <span aria-current="step">
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
        </nav>

        <div className="submit-buttons">
          <button type="button" className="submit-button" onClick={handleSubmit} disabled={!allAnswered}>
            Auswerten & anzeigen
          </button>
        </div>
      </section>
    </main>
  );
}
