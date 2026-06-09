import React, { useEffect, useMemo, useRef, useState } from "react";
import RadialBarChart from "../components/radialBarChart";
import DataTable from "../components/DataTable";
import fragenData from "../components/data/fragen.json";
import handlungsempfehlungenData from "../components/data/handlungsempfehlungen.json";

const SurveyResultPage = ({ surveyResults, activeCompany }) => {
  const [viewMode, setViewMode] = useState("chart");
  const [selectedTab, setSelectedTab] = useState(null);
  const [visibleLevels, setVisibleLevels] = useState(
    new Set([-1, 0, 1, 2, 3, 4])
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const tabRefs = useRef({});

  const questionMap = useMemo(() => buildQuestionMap(fragenData), []);
  const recommendationMap = useMemo(
    () => buildRecommendationMap(handlungsempfehlungenData),
    []
  );

  const selections = useMemo(
    () => normalizeSelections(surveyResults?.selections),
    [surveyResults]
  );

  const data = useMemo(() => {
    const rows = Array.isArray(surveyResults?.results) ? surveyResults.results : [];

    return rows
      .filter(
        (row) =>
          row &&
          row.group &&
          row.category &&
          typeof row.value === "number"
      )
      .map((row, index) => {
        const relevantSelections = getSelectionsForRow(selections, {
          group: row.group,
          category: row.category,
        });

        const selectedLevels = relevantSelections
          .map((selection) => {
            const question = questionMap?.[selection?.frageId];
            const selectedAnswer = getSelectedAnswer(
              question,
              selection?.antwortId
            );
            return typeof selectedAnswer?.stufe === "number"
              ? selectedAnswer.stufe
              : null;
          })
          .filter((level) => typeof level === "number");

        const hasAnsweredQuestions = selectedLevels.length > 0;
        const lowestSelectedLevel = hasAnsweredQuestions
          ? Math.min(...selectedLevels)
          : -1;

        return {
          id: row.id ?? `${row.group}-${row.category}-${index}`,
          group: row.group,
          category: row.category,
          value: hasAnsweredQuestions ? lowestSelectedLevel + 1 : 0,
        };
      });
  }, [surveyResults, selections, questionMap]);

  const dimensionData = useMemo(() => {
    return data.reduce((acc, row) => {
      if (!acc[row.group]) acc[row.group] = {};
      acc[row.group][row.category] = row.value;
      return acc;
    }, {});
  }, [data]);

  const dimensionKeys = useMemo(() => Object.keys(dimensionData), [dimensionData]);

  useEffect(() => {
    if (!dimensionKeys.length) {
      setSelectedTab(null);
      return;
    }

    if (!selectedTab || !dimensionKeys.includes(selectedTab)) {
      setSelectedTab(dimensionKeys[0]);
    }
  }, [dimensionKeys, selectedTab]);

  const handleCheckboxChange = (level) => {
    setVisibleLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const focusTab = (dimension) => {
    const tab = tabRefs.current[dimension];
    if (tab) tab.focus();
  };

  const handleTabKeyDown = (event, currentDimension) => {
    const currentIndex = dimensionKeys.indexOf(currentDimension);
    if (currentIndex === -1) return;

    let nextIndex = null;

    switch (event.key) {
      case "ArrowRight":
      case "Right":
        nextIndex = (currentIndex + 1) % dimensionKeys.length;
        break;
      case "ArrowLeft":
      case "Left":
        nextIndex = (currentIndex - 1 + dimensionKeys.length) % dimensionKeys.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = dimensionKeys.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextDimension = dimensionKeys[nextIndex];
    setSelectedTab(nextDimension);
    focusTab(nextDimension);
  };

  const renderRecommendationGroupCard = (groupItem, index, variant) => {
    const isTodo = variant === "todo";

    if (isTodo) {
      return (
        <div
          key={`${groupItem.frageId}-${variant}-${index}`}
          className={`question-recommendation-card ${variant}`}
        >
          <div className="question-recommendation-summary static">
            <div className="question-recommendation-summary-text">
              <span className="question-recommendation-kicker">Frage</span>
              <h6>{groupItem.frageText}</h6>
              <p>
                <strong>Ausgewählte Antwort:</strong> {groupItem.antwortText}
              </p>
            </div>

            {typeof groupItem.stufe === "number" && (
              <span className="question-recommendation-stage">
                Stufe {groupItem.stufe}
              </span>
            )}
          </div>

          <div className="question-recommendation-panel always-open">
            <p className="question-recommendation-panel-label">
              Zugehörige Handlungsempfehlungen
            </p>
            <ul className="question-recommendation-list">
              {groupItem.recommendations.map((rec, recIndex) => (
                <li
                  key={rec?.id ?? `${groupItem.frageId}-rec-${recIndex}`}
                  className="question-recommendation-list-item"
                >
                  <div className="question-recommendation-list-row">
                    <span>{rec?.text ?? String(rec)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    return (
      <details
        key={`${groupItem.frageId}-${variant}-${index}`}
        className={`question-recommendation-card ${variant}`}
      >
        <summary className="question-recommendation-summary">
          <div className="question-recommendation-summary-text">
            <span className="question-recommendation-kicker">Frage</span>
            <h6>{groupItem.frageText}</h6>
            <p>
              <strong>Ausgewählte Antwort:</strong> {groupItem.antwortText}
            </p>
          </div>

          {typeof groupItem.stufe === "number" && (
            <span className="question-recommendation-stage">
              Stufe {groupItem.stufe}
            </span>
          )}
        </summary>

        <div className="question-recommendation-panel">
          <p className="question-recommendation-panel-label">
            Zugehörige Handlungsempfehlungen
          </p>
          <ul className="question-recommendation-list">
            {groupItem.recommendations.map((rec, recIndex) => (
              <li
                key={rec?.id ?? `${groupItem.frageId}-rec-${recIndex}`}
                className="question-recommendation-list-item"
              >
                <div className="question-recommendation-list-row">
                  <span>{rec?.text ?? String(rec)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </details>
    );
  };

  const renderRecommendations = (row) => {
    const {
      todoGroups,
      establishedHigherGroups,
      nextTargetLevel,
    } = getRecommendationSectionsForRow({
      row,
      selections,
      questionMap,
      recommendationMap,
    });

    return (
      <>
        <div className="recommendation-section">
          <h5 className="recommendation-section-title">
            {typeof nextTargetLevel === "number"
              ? `Offene Handlungsempfehlungen für Stufe ${nextTargetLevel}`
              : "Nächster Entwicklungsschritt"}
          </h5>

          {todoGroups.length > 0 ? (
            <div className="question-recommendation-grid">
              {todoGroups.map((groupItem, index) =>
                renderRecommendationGroupCard(groupItem, index, "todo")
              )}
            </div>
          ) : (
            <div className="recommendation-empty-state">
              <p>
                Aktuell keine Handlungsempfehlungen verfügbar. Sie haben entweder die höchste Stufe erreicht oder das Handlungsfeld mit "keine Angabe" beantwortet.
              </p>
            </div>
          )}
        </div>

        <details className="already-done-block">
          <summary>
            Bereits gut umgesetzt: nächste und höhere Stufen (
            {establishedHigherGroups.length})
          </summary>

          {establishedHigherGroups.length > 0 ? (
            <div className="question-recommendation-grid">
              {establishedHigherGroups.map((groupItem, index) =>
                renderRecommendationGroupCard(groupItem, index, "established")
              )}
            </div>
          ) : (
            <p className="already-done-empty">
              Für die nächste und höhere Stufen wurden noch keine bereits
              umgesetzten Maßnahmen erkannt.
            </p>
          )}
        </details>
      </>
    );
  };

  const hasValidResults = !!surveyResults && Array.isArray(surveyResults.results);

  if (!hasValidResults) {
    return (
      <div className="mainContainer" id="top">
        <h1>Fehler: Ergebnisse</h1>
        <p>Keine gültigen Survey-Ergebnisse gefunden.</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="mainContainer" id="top">
        <h1>Fehler: Ergebnisse</h1>
        <p>Die Survey-Ergebnisse enthalten keine anzeigbaren Einträge.</p>
      </div>
    );
  }

  return (
    <div className="resultsPage">
      <div className="mainContainer resultsHeader" id="top">
        <h1>Ergebnisse</h1>
        <p>
          Hier finden Sie eine detaillierte Auswertung der Survey-Ergebnisse
          nach Dimensionen und Handlungsfeldern.
        </p>

        <div className="toggle-container" role="group" aria-label="Darstellung auswählen">
          <button
            type="button"
            className={`toggle-button ${viewMode === "chart" ? "active" : ""}`}
            aria-pressed={viewMode === "chart"}
            onClick={() => setViewMode("chart")}
          >
            Diagramm anzeigen
          </button>
          <button
            type="button"
            className={`toggle-button ${viewMode === "table" ? "active" : ""}`}
            aria-pressed={viewMode === "table"}
            onClick={() => setViewMode("table")}
          >
            Tabelle anzeigen
          </button>
        </div>
      </div>

      <a href="#ext" className="skip-link">
        Diagramm und Tabelle überspringen
      </a>

      <div>
        {viewMode === "chart" ? (
          <div className="chart-container">
            <RadialBarChart data={data} activeCompany={activeCompany} />
          </div>
        ) : (
          <div className="table-container">
            <DataTable data={data} />
          </div>
        )}
      </div>

      <section id="ext" className="resultsDetails" aria-labelledby="results-details-title">
        <h2 id="results-details-title">Erläuterungen</h2>
        <div className="category-box">
          <p>
            <strong>Hinweis:</strong> Je nach Fragenlogik, Antwortoptionen und
            bereits erreichten Synergien kann es vorkommen, dass keine direkte
            Zwischenstufe angezeigt wird. Das bedeutet nicht automatisch, dass
            alle Maßnahmen dieser Stufe bereits vollständig umgesetzt sind. Es
            bedeutet nur, dass in den aktuell beantworteten Fragen für diese
            Zwischenstufe keine eigenen Handlungsempfehlungen hinterlegt sind
            oder dass der nächste sinnvolle Entwicklungsschritt erst auf einer
            höher erreichbaren Stufe sichtbar wird.
          </p>
        </div>

        <div className="tabs-container">
          <div className="tabs-list" role="tablist" aria-label="Dimensionen">
            {dimensionKeys.map((dimension) => {
              const isSelected = selectedTab === dimension;
              const slug = slugifyId(dimension);
              const tabId = `survey-dimension-tab-${slug}`;
              const panelId = `survey-dimension-panel-${slug}`;

              return (
                <button
                  key={dimension}
                  id={tabId}
                  ref={(node) => {
                    tabRefs.current[dimension] = node;
                  }}
                  role="tab"
                  type="button"
                  className={`tab-button ${isSelected ? "active" : ""}`}
                  aria-selected={isSelected ? "true" : "false"}
                  aria-controls={panelId}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedTab(dimension)}
                  onKeyDown={(event) => handleTabKeyDown(event, dimension)}
                >
                  {dimension}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="filter-toggle-button"
            aria-expanded={isFilterOpen ? "true" : "false"}
            aria-controls="survey-dimension-filter-panel"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            Filter
          </button>
        </div>

        {isFilterOpen && (
          <div id="survey-dimension-filter-panel" className="filter-container">
            <div className="filter-options">
              {[-1, 0, 1, 2, 3, 4].map((level) => (
                <label key={level} className="filter-option">
                  <input
                    type="checkbox"
                    checked={visibleLevels.has(level)}
                    onChange={() => handleCheckboxChange(level)}
                  />
                  {level === -1 ? "Noch nicht betrachtet" : `Stufe ${level}`}
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

      {selectedTab && (
        <div
          id={`survey-dimension-panel-${slugifyId(selectedTab)}`}
          className="tab-content"
          role="tabpanel"
          aria-labelledby={`survey-dimension-tab-${slugifyId(selectedTab)}`}
        >
          <h3>{selectedTab}</h3>

          {data
            .filter((row) => row.group === selectedTab)
            .map((row, idx) => {
              const displayedStufe = row.value - 1;
              if (!visibleLevels.has(displayedStufe)) return null;

              return (
                <div key={`${row.category}-${idx}`} className="category-box">
                  <h4>{row.category}</h4>
                  <p>
                    <strong>Erreichte Stufe:</strong>{" "}
                    {displayedStufe === -1
                      ? "Noch nicht betrachtet"
                      : displayedStufe}
                  </p>
                  {renderRecommendations(row)}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

function normalizeSelections(selections) {
  if (Array.isArray(selections)) return selections;
  if (selections && typeof selections === "object") {
    return Object.values(selections).filter(Boolean);
  }
  return [];
}

function buildQuestionMap(source) {
  const questions = source?.fragen ?? [];
  return questions.reduce((acc, question) => {
    acc[question.id] = question;
    return acc;
  }, {});
}

function buildRecommendationMap(source) {
  const items = source?.handlungsempfehlungen ?? [];
  const map = {};

  items.forEach((rec) => {
    const normalized = {
      id: rec.id,
      text: rec.name,
      levels: [],
      triggerAnswerIds: [],
    };

    (rec.antworten ?? []).forEach((answerRef) => {
      expandAnswerReference(answerRef?.id).forEach((answerId) => {
        if (!map[answerId]) map[answerId] = [];
        map[answerId].push({
          ...normalized,
          levels: collectLevelsForAnswerId(answerId),
          triggerAnswerIds: [answerId],
        });
      });
    });
  });

  return map;
}

function collectLevelsForAnswerId(answerId) {
  const questions = fragenData?.fragen ?? [];
  const levels = questions
    .flatMap((question) => question?.antworten ?? [])
    .filter(
      (answer) => answer?.id === answerId && typeof answer?.stufe === "number"
    )
    .map((answer) => answer.stufe);

  return [...new Set(levels)].sort((a, b) => a - b);
}

function expandAnswerReference(ref) {
  if (!ref || typeof ref !== "string") return [];

  if (ref.includes("-")) {
    const parts = ref
      .split("-")
      .map((s) => s.trim())
      .filter(Boolean);

    if (
      parts.length === 2 &&
      /^A\d+$/.test(parts[0]) &&
      /^A\d+$/.test(parts[1])
    ) {
      const start = Number(parts[0].slice(1));
      const end = Number(parts[1].slice(1));
      const [from, to] = start <= end ? [start, end] : [end, start];
      return Array.from({ length: to - from + 1 }, (_, i) => `A${from + i}`);
    }
  }

  return [ref.replace(/\?$/, "")];
}

function getSelectionsForRow(selections, row) {
  return (Array.isArray(selections) ? selections : []).filter(
    (selection) =>
      selection?.group === row.group && selection?.category === row.category
  );
}

function getSelectedAnswer(question, selectedAnswerId) {
  return (
    (question?.antworten ?? []).find(
      (answer) => answer.id === selectedAnswerId
    ) ?? null
  );
}

function getRecommendationSectionsForRow({
  row,
  selections,
  questionMap,
  recommendationMap,
}) {
  const relevantSelections = getSelectionsForRow(selections, row);

  const selectionsWithLevel = relevantSelections
    .map((selection) => {
      const question = questionMap?.[selection?.frageId];
      const selectedAnswer = getSelectedAnswer(question, selection?.antwortId);
      const stufe =
        typeof selectedAnswer?.stufe === "number"
          ? selectedAnswer.stufe
          : selection?.stufe;

      return {
        selection,
        question,
        selectedAnswer,
        stufe,
      };
    })
    .filter(
      (item) =>
        typeof item.stufe === "number" &&
        item.stufe >= 0 &&
        item.selection?.antwortId
    );

  const currentCategoryLevel =
    selectionsWithLevel.length > 0
      ? Math.min(...selectionsWithLevel.map((item) => item.stufe))
      : -1;

  const todoGroups = selectionsWithLevel
    .filter((item) => item.stufe === currentCategoryLevel)
    .map(({ selection, question, selectedAnswer, stufe }) => {
      const selectedRecommendations = dedupeRecommendations(
        recommendationMap[selection?.antwortId] ?? []
      );

      if (!selectedRecommendations.length) return null;

      return {
        frageId: selection?.frageId,
        frageText: selection?.frageText || question?.frage || "Frage",
        antwortText:
          selectedAnswer?.antwort || selection?.antwortText || "Antwort",
        stufe,
        recommendations: selectedRecommendations,
      };
    })
    .filter(Boolean);

  const establishedHigherGroups = selectionsWithLevel
    .filter((item) => item.stufe > currentCategoryLevel)
    .map(({ selection, question, selectedAnswer, stufe }) => {
      const selectedRecommendations = dedupeRecommendations(
        recommendationMap[selection?.antwortId] ?? []
      );

      if (!selectedRecommendations.length) return null;

      return {
        frageId: selection?.frageId,
        frageText: selection?.frageText || question?.frage || "Frage",
        antwortText:
          selectedAnswer?.antwort || selection?.antwortText || "Antwort",
        stufe,
        recommendations: selectedRecommendations,
      };
    })
    .filter(Boolean);

  return {
    todoGroups,
    establishedHigherGroups,
    nextTargetLevel: currentCategoryLevel >= 0 ? currentCategoryLevel : null,
  };
}

function dedupeRecommendations(recommendations) {
  const seen = new Set();
  return (Array.isArray(recommendations) ? recommendations : []).filter(
    (rec, index) => {
      const key = rec?.id ?? rec?.text ?? `rec-${index}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }
  );
}

function slugifyId(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export default SurveyResultPage;
