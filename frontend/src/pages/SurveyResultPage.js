import React, { useMemo, useState } from "react";
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
    const rows = surveyResults?.results ?? [];

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

  if (!surveyResults || !Array.isArray(surveyResults.results)) {
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

  const dimensionData = data.reduce((acc, row) => {
    if (!acc[row.group]) acc[row.group] = {};
    acc[row.group][row.category] = row.value;
    return acc;
  }, {});

  const handleCheckboxChange = (level) => {
    setVisibleLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
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
                Herzlichen Glückwunsch – in den aktuell beantworteten Fragen
                wurde bereits die höchstmögliche erreichbare Stufe abgedeckt.
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

  const renderQuestionCrosscheck = () => {
    if (selections.length === 0) {
      return <p>Es wurden noch keine Fragen beantwortet.</p>;
    }

    return selections.map((selection, index) => {
      const question = questionMap?.[selection?.frageId];
      const answers = Array.isArray(question?.antworten)
        ? question.antworten
        : [];

      return (
        <div
          key={`${selection?.frageId ?? "frage"}-${index}`}
          className="question-reference-card"
        >
          <h4 className="question-reference-title">
            {selection?.frageText || question?.frage || "Frage"}
          </h4>

          <p className="question-reference-area">
            <strong>Bereich:</strong> {selection?.group} –{" "}
            {selection?.category}
          </p>

          <ul className="question-answer-list">
            {answers.map((answer) => {
              const isSelected = answer?.id === selection?.antwortId;
              const linkedRecommendations = dedupeRecommendations(
                recommendationMap[answer?.id] ?? []
              );

              return (
                <li
                  key={answer?.id}
                  className={`question-answer-item ${
                    isSelected ? "question-answer-selected" : ""
                  }`}
                >
                  <p>
                    <strong>{isSelected ? "Ausgewählt:" : "Antwort:"}</strong>{" "}
                    {answer?.antwort}
                  </p>

                  <p>
                    <strong>Stufe:</strong>{" "}
                    {typeof answer?.stufe === "number"
                      ? answer.stufe
                      : "Keine Stufe"}
                  </p>

                  {linkedRecommendations.length > 0 ? (
                    <div className="question-linked-recommendations">
                      <strong>Verknüpfte Handlungsempfehlungen:</strong>
                      <ul>
                        {linkedRecommendations.map((rec, recIndex) => (
                          <li key={rec?.id ?? `${answer?.id}-${recIndex}`}>
                            {rec?.text ?? String(rec)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="question-no-recommendations">
                      Keine verknüpften Handlungsempfehlungen.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      );
    });
  };

  return (
    <div>
      <div className="mainContainer" id="top">
        <h1>Ergebnisse</h1>
        <p>
          Hier finden Sie eine detaillierte Auswertung der Survey-Ergebnisse
          nach Dimensionen und Handlungsfeldern.
        </p>

        <div className="toggle-container">
          <button
            className={`toggle-button ${viewMode === "chart" ? "active" : ""}`}
            onClick={() => setViewMode("chart")}
          >
            Diagramm anzeigen
          </button>
          <button
            className={`toggle-button ${viewMode === "table" ? "active" : ""}`}
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

      <div id="ext">
        <h2>Erläuterungen</h2>
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
          {Object.keys(dimensionData).map((dimension) => (
            <button
              key={dimension}
              className={`tab-button ${
                selectedTab === dimension ? "active" : ""
              }`}
              onClick={() => setSelectedTab(dimension)}
            >
              {dimension}
            </button>
          ))}

          <button
            className="filter-toggle-button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            Filter
          </button>
        </div>

        {isFilterOpen && (
          <div className="filter-container">
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
      </div>

      {selectedTab && (
        <div className="tab-content">
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

      <div className="question-reference-section">
        <details className="question-reference-accordion">
          <summary className="question-reference-summary">
            <span>Fragen- und Antwortübersicht zum Abgleich</span>
            <span className="question-reference-badge">
              {selections.length} beantwortet
            </span>
          </summary>

          <div className="question-reference-panel">
            <p className="question-reference-intro">
              Hier sehen Sie alle verwendeten Fragen, alle Antwortoptionen und
              die jeweils verknüpften Handlungsempfehlungen. Die gewählte Antwort
              ist markiert.
            </p>
            {renderQuestionCrosscheck()}
          </div>
        </details>
      </div>
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
    .filter((item) => typeof item.stufe === "number");

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

export default SurveyResultPage;