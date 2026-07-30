import React, { useEffect, useMemo, useState } from "react";
import struktur from "../components/data/struktur.json";
import fragen from "../components/data/fragen.json";
import handlEmpf from "../components/data/handlungsempfehlungen.json";
import { useParams, useNavigate } from "react-router-dom";
import { answersToResultsWithRecommendations } from "../services/questionnaireToResults";
import CommentBox from "./CommentFunction";
import { API_BASE } from "../config.ts";

export default function QuestionnairePage({ activeCompany }) {
  const { dimensionId, handlungsfeldId } = useParams();
  const navigate = useNavigate();

  const [allAnswers, setAllAnswers] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [activeDimensionIds, setActiveDimensionIds] = useState([]);
  const [postedComments, setPostedComments] = useState([]);
  const [inputs, setInputs] = useState({ user: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentDimension = struktur.dimensionen.find(
    (d) => d.id === dimensionId,
  );
  const handlungsfelder = currentDimension?.handlungsfelder || [];
  const currentHFIndex = handlungsfelder.findIndex(
    (h) => h.id === handlungsfeldId,
  );
  const currentHandlungsfeld = handlungsfelder[currentHFIndex];
  const commentsEnabled = activeCompany === "Shuffle";

  const filteredFragen = useMemo(() => {
    if (!currentHandlungsfeld) return [];

    return currentHandlungsfeld.fragen
      .map((ref) => fragen.fragen.find((f) => f.id === ref.id))
      .filter(Boolean);
  }, [currentHandlungsfeld]);

  function setStatusMessage(text, type = "status") {
    setPageMessage({ text, type });
  }

  function flattenSelections(allAnswersByDimension) {
    return Object.values(allAnswersByDimension)
      .flatMap((dimensionAnswers) => Object.values(dimensionAnswers || {}))
      .filter(Boolean);
  }

  function buildAggregatedResults(allAnswersByDimension) {
    const mergedRows = new Map();

    Object.entries(allAnswersByDimension).forEach(
      ([dimId, answersForDimension]) => {
        if (
          !answersForDimension ||
          Object.keys(answersForDimension).length === 0
        ) {
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
            row?.id ||
            `${row?.group || "group"}__${row?.category || "category"}__${index}`;
          mergedRows.set(key, row);
        });
      },
    );

    return Array.from(mergedRows.values());
  }

  function getEffectiveActiveDimensionIds() {
    return activeDimensionIds.length > 0
      ? activeDimensionIds
      : struktur.dimensionen.map((d) => d.id);
  }

  function isDimensionComplete(dimId, answersByDimension) {
    const dimension = struktur.dimensionen.find((d) => d.id === dimId);
    if (!dimension) return false;

    const totalQuestions = dimension.handlungsfelder.reduce(
      (sum, hf) => sum + (hf.fragen?.length || 0),
      0,
    );

    const answeredCount = Object.keys(answersByDimension[dimId] || {}).length;

    return totalQuestions > 0 && answeredCount === totalQuestions;
  }

  function isTeamComplete(answersByDimension) {
    const activeIds = getEffectiveActiveDimensionIds();

    return (
      activeIds.length > 0 &&
      activeIds.every((dimId) => isDimensionComplete(dimId, answersByDimension))
    );
  }

  async function saveCurrentAnswers(nextAllAnswers) {
    const response = await fetch(`${API_BASE}/session/current-state`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAnswers: nextAllAnswers }),
    });

    if (response.status === 401) {
      setStatusMessage(
        "Ihre Sitzung ist nicht mehr gültig. Sie werden zur Anmeldung weitergeleitet.",
        "error",
      );
      navigate("/login");
      return false;
    }

    if (response.status === 403) {
      setStatusMessage(
        "Bitte zuerst ein Team auswählen. Sie werden zur Teamauswahl weitergeleitet.",
        "error",
      );
      navigate("/team-select");
      return false;
    }

    if (!response.ok) {
      throw new Error(`Server antwortete mit Status ${response.status}`);
    }

    return true;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stateResponse, settingsResponse] = await Promise.all([
          fetch(`${API_BASE}/session/current-state`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/session/settings`, {
            credentials: "include",
          }),
        ]);

        if (stateResponse.status === 401 || settingsResponse.status === 401) {
          setStatusMessage(
            "Ihre Sitzung ist nicht mehr gültig. Sie werden zur Anmeldung weitergeleitet.",
            "error",
          );
          navigate("/login");
          return;
        }

        if (stateResponse.status === 403 || settingsResponse.status === 403) {
          setStatusMessage(
            "Bitte zuerst ein Team auswählen. Sie werden zur Teamauswahl weitergeleitet.",
            "error",
          );
          navigate("/team-select");
          return;
        }

        if (!stateResponse.ok) {
          throw new Error(`State-Status ${stateResponse.status}`);
        }

        if (!settingsResponse.ok) {
          throw new Error(`Settings-Status ${settingsResponse.status}`);
        }

        const stateData = await stateResponse.json();
        const settingsData = await settingsResponse.json();

        const loadedAnswers =
          stateData.currentAnswers &&
          typeof stateData.currentAnswers === "object"
            ? stateData.currentAnswers
            : {};

        setAllAnswers(loadedAnswers);
        setSelectedAnswers(loadedAnswers[dimensionId] || {});
        setActiveDimensionIds(
          Array.isArray(settingsData.activeDimensions)
            ? settingsData.activeDimensions
            : [],
        );
        setStatusMessage("", "");
      } catch (error) {
        console.error("Fehler beim Laden des aktuellen Zustands:", error);
        setAllAnswers({});
        setSelectedAnswers({});
        setActiveDimensionIds([]);
        setStatusMessage(
          "Der aktuelle Zustand konnte nicht geladen werden.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dimensionId, handlungsfeldId, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [dimensionId, handlungsfeldId]);

  if (!currentDimension || !currentHandlungsfeld) {
    return <p>Handlungsfeld nicht gefunden.</p>;
  }

  if (loading) {
    return (
      <div className="mainContainer" id="top">
        <p aria-live="polite">Lade Fragen...</p>
      </div>
    );
  }

  const handleAnswerClick = async (frage, antwort) => {
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

    const nextAnswersForDimension = {
      ...(allAnswers[dimensionId] || {}),
      [frage.id]: nextSelection,
    };

    const nextAllAnswers = {
      ...allAnswers,
      [dimensionId]: nextAnswersForDimension,
    };

    setAllAnswers(nextAllAnswers);
    setSelectedAnswers(nextAnswersForDimension);
    setStatusMessage("", "");

    try {
      await saveCurrentAnswers(nextAllAnswers);
    } catch (error) {
      console.error("Fehler beim Speichern der Antworten:", error);
      setStatusMessage("Antworten konnten nicht gespeichert werden.", "error");
    }
  };

  const buildFullPayload = () => {
    const currentAnswers = {
      ...allAnswers,
      [dimensionId]: {
        ...(allAnswers[dimensionId] || {}),
        ...selectedAnswers,
      },
    };

    const selections = flattenSelections(currentAnswers);
    const results = buildAggregatedResults(currentAnswers);

    const snapshotType = isTeamComplete(currentAnswers)
      ? "team_complete"
      : isDimensionComplete(dimensionId, currentAnswers)
        ? "dimension_complete"
        : null;

    return {
      dimensionId,
      handlungsfeldId,
      timestamp: new Date().toISOString(),
      snapshotType,
      results,
      selections,
      comments: postedComments,
    };
  };

  const handleSubmit = async () => {
    const payload = buildFullPayload();
    setIsSubmitting(true);
    setStatusMessage("Fragebogen wird gespeichert...", "status");

    try {
      const response = await fetch(`${API_BASE}/session/results`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setStatusMessage(
          "Ihre Sitzung ist nicht mehr gültig. Sie werden zur Anmeldung weitergeleitet.",
          "error",
        );
        navigate("/login");
        return;
      }

      if (response.status === 403) {
        setStatusMessage(
          "Bitte zuerst ein Team auswählen. Sie werden zur Teamauswahl weitergeleitet.",
          "error",
        );
        navigate("/team-select");
        return;
      }

      if (!response.ok) {
        throw new Error(`Server antwortete mit Status ${response.status}`);
      }

      setStatusMessage(
        "Fragebogen erfolgreich gespeichert. Weiterleitung zur Paketübersicht.",
        "status",
      );
      navigate("/dimensions");
    } catch (error) {
      console.error("Fehler beim Senden:", error);
      setStatusMessage(
        "Backend nicht erreichbar oder Fehler beim Speichern.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handlePost = () => {
    if (!inputs.user || !inputs.text) {
      setStatusMessage(
        "Bitte geben Sie Nutzername und Kommentar ein, bevor Sie senden.",
        "error",
      );
      return;
    }

    setPostedComments((prev) => [...prev, inputs]);
    setInputs({ user: "", text: "" });
    setStatusMessage("Kommentar hinzugefügt.", "status");
  };

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
        <p>
          Nehmen Sie eine realistische Selbsteinschätzung vor. <br />
          Beziehen Sie die Fragen ausschließlich auf Ihre Organisationseinheit.{" "}
          <br />
          Falls mehrere Antworten für Sie zutreffen, wählen Sie die unterste
          zutreffende Antwort. <br />
          Falls eine Frage für Sie nicht zutrifft, wählen Sie „Keine Angabe“.
        </p>

        {pageMessage.text && (
          <div
            className="access-error access-error-prominent"
            role={pageMessage.type === "error" ? "alert" : "status"}
            aria-live={pageMessage.type === "error" ? "assertive" : "polite"}
          >
            {pageMessage.text}
          </div>
        )}

        {filteredFragen.length === 0 ? (
          <p>Keine Fragen für dieses Handlungsfeld gefunden.</p>
        ) : (
          filteredFragen.map((frage) => (
            <section
              key={frage.id}
              className="question-box"
              aria-labelledby={`question-${frage.id}`}
            >
              <div className="homeEyebrowright">
                <p className="homeEyebrow">
                  {currentHandlungsfeld?.name}
                </p>
              </div>
              <h3 id={`question-${frage.id}`} className="question-text">
                {frage.frage}
              </h3>

              <p id={`question-instruction-${frage.id}`} className="sr-only">
                Wählen Sie genau eine Antwort. Der aktuell ausgewählte Button
                wird als gedrückt ausgegeben.
              </p>
              <div
                className="answers"
                role="group"
                aria-labelledby={`question-${frage.id}`}
                aria-describedby={`question-instruction-${frage.id}`}
              >
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
                      type="button"
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
          ))
        )}

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

        <div className="submit-buttons">
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Speichern..."
              : "Fragebogen schließen und zur Paketübersicht zurückkehren"}
          </button>
        </div>
      </div>
    </div>
  );
}
