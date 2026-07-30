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
  const [jumpAnnouncement, setJumpAnnouncement] = useState("");
  const [jumpRequestId, setJumpRequestId] = useState(0);
  const tabRefs = useRef({});
  const pendingRecommendationTargetRef = useRef(null);

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

  useEffect(() => {
    const pendingTarget = pendingRecommendationTargetRef.current;
    if (!pendingTarget || selectedTab !== pendingTarget.group) return;

    const target = document.getElementById(pendingTarget.id);
    if (!target) return;

    pendingRecommendationTargetRef.current = null;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.focus({ preventScroll: true });
    setJumpAnnouncement(
      `Handlungsempfehlungen für ${pendingTarget.category} werden angezeigt.`
    );
  }, [selectedTab, visibleLevels, jumpRequestId]);

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

  const handleDownloadJson = () => {
    const exportPayload = {
      team: surveyResults?.team || null,
      exportedAt: new Date().toISOString(),
      result: surveyResults,
    };

    const teamSlug = (surveyResults?.team || "team")
      .toString()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    const datePart = new Date().toISOString().slice(0, 10);
    const fileName = `results_${teamSlug}_${datePart}.json`;

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRecommendationJump = (entry) => {
    if (!entry?.group || !entry?.category) return;

    const displayedLevel = entry.value - 1;
    pendingRecommendationTargetRef.current = {
      id: getRecommendationTargetId(entry),
      group: entry.group,
      category: entry.category,
    };

    setJumpAnnouncement("");
    setVisibleLevels((currentLevels) => {
      if (currentLevels.has(displayedLevel)) return currentLevels;
      const nextLevels = new Set(currentLevels);
      nextLevels.add(displayedLevel);
      return nextLevels;
    });
    setSelectedTab(entry.group);
    setJumpRequestId((currentId) => currentId + 1);
  };

  const renderRecommendationGroupCard = (groupItem, index, variant) => {
    const isTodo = variant === "todo";
    const accessibleId = slugifyId(`${variant}-${groupItem.frageId}-${index}`);
    const questionId = `recommendation-question-${accessibleId}`;
    const answerId = `recommendation-answer-${accessibleId}`;
    const stageId = `recommendation-stage-${accessibleId}`;

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
        <summary
          className="question-recommendation-summary"
          aria-labelledby={questionId}
          aria-describedby={
            typeof groupItem.stufe === "number"
              ? `${answerId} ${stageId}`
              : answerId
          }
        >
          <div className="question-recommendation-summary-text">
            <span className="question-recommendation-kicker">Frage</span>
            <h6 id={questionId}>{groupItem.frageText}</h6>
            <p id={answerId}>
              <strong>Ausgewählte Antwort:</strong> {groupItem.antwortText}
            </p>
          </div>

          {typeof groupItem.stufe === "number" && (
            <span id={stageId} className="question-recommendation-stage">
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
    <div>
      <div className="mainContainer" id="top">
        <h1>Ergebnisse</h1>
        <p>
          Hier finden Sie eine detaillierte Auswertung der Ergebnisse des Fragebogens
          nach Dimensionen und Handlungsfeldern.
        </p>

        <div
          className="toggle-container"
          role="group"
          aria-labelledby="survey-result-view-mode-label"
        >
          <span id="survey-result-view-mode-label" className="sr-only">
            Darstellung der Ergebnisse
          </span>
          <button
            type="button"
            className={`toggle-button ${viewMode === "chart" ? "active" : ""}`}
            onClick={() => setViewMode("chart")}
            aria-pressed={viewMode === "chart"}
          >
            Diagramm anzeigen
          </button>
          <button
            type="button"
            className={`toggle-button ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
          >
            Tabelle anzeigen
          </button>
          <button
            type="button"
            className="toggle-button secondary"
            onClick={handleDownloadJson}
          >
            JSON herunterladen
          </button>
        </div>
      </div>

      <a href="#ext" className="skip-link">
        Diagramm und Tabelle überspringen
      </a>

      <div>
        {viewMode === "chart" ? (
          <div className="chart-container">
            <RadialBarChart
              data={data}
              activeCompany={activeCompany}
              ariaLabel="Ergebnisdiagramm. Beim Zeigen oder Fokussieren eines Handlungsfeldes erscheint ein Link zu den zugehörigen Handlungsempfehlungen. Bei Tastaturbedienung drücken Sie auf dem Handlungsfeld Enter, um direkt dorthin zu springen."
              onSegmentClick={handleRecommendationJump}
              segmentActionText="Handlungsempfehlungen anzeigen"
            />
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
            <strong>Legende:</strong> Die importierten Päckchen der Organisationseinheit sind im Ergebnisdiagramm farblich voneinander abgegrenzt dargestellt. Innerhalb jedes Päckchens werden thematische Handlungsfelder unterschieden, die den einzelnen Seiten des Fragebogens entsprechen. Der farbige Balkenausschlag zeigt den erreichten Reifegrad (0–4) pro Handlungsfeld an. Ein fehlender Ausschlag bedeutet, dass das entsprechende Handlungsfeld noch nicht ausgefüllt, oder als nicht relevant bewertet wurde.
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
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-expanded={isFilterOpen ? "true" : "false"}
            aria-controls="survey-dimension-filter-panel"
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
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {jumpAnnouncement}
      </p>

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
                <div
                  key={`${row.category}-${idx}`}
                  id={getRecommendationTargetId(row)}
                  className="category-box recommendation-jump-target"
                  tabIndex={-1}
                  aria-labelledby={`${getRecommendationTargetId(row)}-heading`}
                >
                  <h4 id={`${getRecommendationTargetId(row)}-heading`}>
                    {row.category}
                  </h4>
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

  function renderRecommendations(row) {
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
            Bereits gut umgesetzte Maßnahmen auf höheren Stufen (
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
  }
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

function getRecommendationTargetId(row) {
  return `handlungsempfehlungen-${slugifyId(row?.group)}-${slugifyId(
    row?.category
  )}`;
}

export default SurveyResultPage;
