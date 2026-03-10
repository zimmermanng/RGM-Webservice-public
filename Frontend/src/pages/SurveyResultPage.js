import React, { useMemo, useState } from "react";
import RadialBarChart from "../components/radialBarChart";
import DataTable from "../components/DataTable";
import "./ResultPage.css";
import fragenData from "../components/data/fragen.json";
import handlungsempfehlungenData from "../components/data/handlungsempfehlungen.json";

const SurveyResultPage = ({ surveyResults, activeCompany }) => {
  const [viewMode, setViewMode] = useState("chart");
  const [selectedTab, setSelectedTab] = useState(null);
  const [visibleLevels, setVisibleLevels] = useState(new Set([0, 1, 2, 3, 4]));
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const questionMap = useMemo(() => buildQuestionMap(fragenData), []);
  const recommendationMap = useMemo(
    () => buildRecommendationMap(handlungsempfehlungenData),
    []
  );

  const data = useMemo(() => {
    const rows = surveyResults?.results ?? [];

    return rows
      .filter(
        (row) => row && row.group && row.category && typeof row.value === "number"
      )
      .map((row, index) => ({
        id: row.id ?? `${row.group}-${row.category}-${index}`,
        group: row.group,
        category: row.category,
        value: row.value + 1,
      }));
  }, [surveyResults]);

  const selections = useMemo(
    () => normalizeSelections(surveyResults?.selections),
    [surveyResults]
  );

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

  const renderRecommendationItem = (rec, keyPrefix, index) => (
    <li key={rec?.id ?? `${keyPrefix}-${index}`}>
      <details>
        <summary>{rec?.text ?? String(rec)}</summary>
        {Array.isArray(rec?.levels) && rec.levels.length > 0 && (
          <p>
            <strong>Stufe:</strong> {rec.levels.join(", ")}
          </p>
        )}
        {Array.isArray(rec?.sources) && rec.sources.length > 0 && (
          <div>
            <strong>Ausgelöst durch:</strong>
            <ul>
              {rec.sources.map((source, sourceIndex) => (
                <li key={`${source.frageId}-${source.antwortId}-${sourceIndex}`}>
                  <p>
                    <strong>Frage:</strong> {source.frageText}
                  </p>
                  <p>
                    <strong>Antwort:</strong> {source.antwortText}
                  </p>
                  {typeof source?.stufe === "number" && (
                    <p>
                      <strong>Stufe:</strong> {source.stufe}
                    </p>
                  )}
                  {typeof source?.coveredLevel === "number" && (
                    <p>
                      <strong>Deckt Maßnahme aus Stufe:</strong> {source.coveredLevel}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>
    </li>
  );

  const renderRecommendations = (row) => {
    const {
      todoRecommendations,
      establishedHigherRecommendations,
      nextTargetLevel,
    } = getRecommendationBucketsForRow({
      row,
      selections,
      questionMap,
      recommendationMap,
    });

    return (
      <>
        <div>
          <h6>
            {typeof nextTargetLevel === "number"
              ? `Offene Handlungsempfehlungen für Stufe ${nextTargetLevel}`
              : "Nächster Entwicklungsschritt"}
          </h6>
          {todoRecommendations.length > 0 ? (
            <ul>
              {todoRecommendations.map((rec, index) =>
                renderRecommendationItem(rec, "todo", index)
              )}
            </ul>
          ) : (
            <p>
              Herzlichen Glückwunsch – in den aktuell beantworteten Fragen wurde bereits die höchstmögliche erreichbare Stufe abgedeckt.
            </p>
          )}
        </div>

        <details className="already-done-block">
          <summary>
            Bereits gut umgesetzt: nächste und höhere Stufen ({establishedHigherRecommendations.length})
          </summary>
          {establishedHigherRecommendations.length > 0 ? (
            <ul>
              {establishedHigherRecommendations.map((rec, index) =>
                renderRecommendationItem(rec, "done-higher", index)
              )}
            </ul>
          ) : (
            <p>
              Für die nächste und höhere Stufen wurden noch keine bereits umgesetzten Maßnahmen erkannt.
            </p>
          )}
        </details>
      </>
    );
  };

  return (
    <div>
      <div className="mainContainer" id="top">
        <h1>Ergebnisse</h1>
        <p>
          Hier finden Sie eine detaillierte Auswertung der Survey-Ergebnisse nach
          Dimensionen und Handlungsfeldern.
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
            <strong>Hinweis:</strong> Je nach Fragenlogik, Antwortoptionen und bereits
            erreichten Synergien kann es vorkommen, dass keine direkte Zwischenstufe
            angezeigt wird. Das bedeutet nicht automatisch, dass alle Maßnahmen dieser
            Stufe bereits vollständig umgesetzt sind. Es bedeutet nur, dass in den aktuell
            beantworteten Fragen für diese Zwischenstufe keine eigenen
            Handlungsempfehlungen hinterlegt sind oder dass der nächste sinnvolle
            Entwicklungsschritt erst auf einer höher erreichbaren Stufe sichtbar wird.
          </p>
        </div>
        <div className="tabs-container">
          {Object.keys(dimensionData).map((dimension) => (
            <button
              key={dimension}
              className={`tab-button ${selectedTab === dimension ? "active" : ""}`}
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
              {[0, 1, 2, 3, 4].map((level) => (
                <label key={level} className="filter-option">
                  <input
                    type="checkbox"
                    checked={visibleLevels.has(level)}
                    onChange={() => handleCheckboxChange(level)}
                  />
                  Stufe {level}
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
                    <strong>Erreichte Stufe:</strong> {displayedStufe}
                  </p>
                  <h5>Handlungsempfehlungen:</h5>
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
      sources: [],
    };

    (rec.antworten ?? []).forEach((answerRef) => {
      expandAnswerReference(answerRef?.id).forEach((answerId) => {
        if (!map[answerId]) map[answerId] = [];
        map[answerId].push({
          ...normalized,
          levels: collectLevelsForAnswerId(answerId),
          sources: collectSourcesForAnswerId(answerId),
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
    .filter((answer) => answer?.id === answerId && typeof answer?.stufe === "number")
    .map((answer) => answer.stufe);

  return [...new Set(levels)].sort((a, b) => a - b);
}

function collectSourcesForAnswerId(answerId) {
  const questions = fragenData?.fragen ?? [];
  return questions
    .flatMap((question) => {
      const matches = (question?.antworten ?? []).filter(
        (answer) => answer?.id === answerId
      );
      return matches.map((answer) => ({
        frageId: question?.id,
        frageText: question?.frage,
        antwortId: answer?.id,
        antwortText: answer?.antwort,
        stufe: answer?.stufe,
      }));
    })
    .filter((entry) => entry?.frageId && entry?.antwortId);
}

function expandAnswerReference(ref) {
  if (!ref || typeof ref !== "string") return [];

  if (ref.includes("-")) {
    const parts = ref.split("-").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 2 && /^A\d+$/.test(parts[0]) && /^A\d+$/.test(parts[1])) {
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
    (question?.antworten ?? []).find((answer) => answer.id === selectedAnswerId) ??
    null
  );
}

function getRecommendationBucketsForRow({
  row,
  selections,
  questionMap,
  recommendationMap,
}) {
  const relevantSelections = getSelectionsForRow(selections, row);
  const currentCategoryLevel = typeof row?.value === "number" ? row.value - 1 : -1;

  const establishedAnswerIdsAll = [];
  const lowerAnswerIds = [];
  const highestEstablishedHigherAnswerIds = [];
  const nextLevelCandidates = [];

  relevantSelections.forEach((selection) => {
    const question = questionMap[selection?.frageId];
    if (!question) return;

    const answers = Array.isArray(question?.antworten) ? question.antworten : [];
    const selectedAnswer = getSelectedAnswer(question, selection?.antwortId);
    const selectedLevel = typeof selectedAnswer?.stufe === "number" ? selectedAnswer.stufe : -1;

    answers.forEach((answer) => {
      if (typeof answer?.stufe !== "number") return;

      if (answer.stufe <= selectedLevel) {
        establishedAnswerIdsAll.push(answer.id);
      }

      if (answer.stufe < currentCategoryLevel) {
        lowerAnswerIds.push(answer.id);
      }

      if (answer.stufe > selectedLevel) {
        nextLevelCandidates.push({
          answerId: answer.id,
          level: answer.stufe,
        });
      }
    });

    const higherEstablishedAnswers = answers
      .filter(
        (answer) =>
          typeof answer?.stufe === "number" &&
          answer.stufe > currentCategoryLevel &&
          answer.stufe <= selectedLevel
      )
      .sort((a, b) => b.stufe - a.stufe);

    if (higherEstablishedAnswers.length > 0) {
      const highestLevelForQuestion = higherEstablishedAnswers[0].stufe;
      higherEstablishedAnswers
        .filter((answer) => answer.stufe === highestLevelForQuestion)
        .forEach((answer) => {
          highestEstablishedHigherAnswerIds.push(answer.id);
        });
    }
  });

  const nextTargetLevel = nextLevelCandidates.length
    ? Math.min(...nextLevelCandidates.map((candidate) => candidate.level))
    : null;

  const nextLevelAnswerIds = nextLevelCandidates
    .filter((candidate) => candidate.level === nextTargetLevel)
    .map((candidate) => candidate.answerId);

  const establishedRecommendationsAll = dedupeRecommendations(
    establishedAnswerIdsAll.flatMap((answerId) => recommendationMap[answerId] ?? [])
  );

  const todoRecommendations = dedupeRecommendations(
    nextLevelAnswerIds
      .flatMap((answerId) => recommendationMap[answerId] ?? [])
      .filter((rec) => !establishedRecommendationsAll.some((done) => done.id === rec.id))
      .filter((rec) => recommendationHasLevel(rec, nextTargetLevel))
  );

  const establishedHigherRecommendations = dedupeRecommendations(
    highestEstablishedHigherAnswerIds
      .flatMap((answerId) => recommendationMap[answerId] ?? [])
      .filter((rec) => establishedRecommendationsAll.some((done) => done.id === rec.id))
      .filter((rec) => recommendationHasLevelAbove(rec, currentCategoryLevel))
  );

  return {
    todoRecommendations,
    establishedHigherRecommendations,    nextTargetLevel,
  };
}

function recommendationHasLevel(rec, targetLevel) {
  if (targetLevel == null) return false;
  const levels = Array.isArray(rec?.levels) ? rec.levels : [];
  return levels.includes(targetLevel);
}

function recommendationHasLevelAtLeast(rec, targetLevel) {
  if (targetLevel == null) return false;
  const levels = Array.isArray(rec?.levels) ? rec.levels : [];
  return levels.some((level) => level >= targetLevel);
}

function recommendationHasLevelAbove(rec, targetLevel) {
  if (targetLevel == null) return false;
  const levels = Array.isArray(rec?.levels) ? rec.levels : [];
  return levels.some((level) => level > targetLevel);
}

function recommendationHasLevelBelow(rec, targetLevel) {
  if (targetLevel == null) return false;
  const levels = Array.isArray(rec?.levels) ? rec.levels : [];
  return levels.some((level) => level < targetLevel);
}

function enrichLowerEstablishedRecommendations(recommendations, relevantSelections, questionMap) {
  return (Array.isArray(recommendations) ? recommendations : []).map((rec) => {
    const lowerSources = Array.isArray(rec?.sources) ? rec.sources : [];

    const coveringSources = lowerSources.flatMap((source) => {
      const selection = (Array.isArray(relevantSelections) ? relevantSelections : []).find(
        (item) => item?.frageId === source?.frageId
      );
      if (!selection) return [];

      const question = questionMap?.[selection.frageId];
      const selectedAnswer = getSelectedAnswer(question, selection?.antwortId);
      const selectedLevel = typeof selectedAnswer?.stufe === "number" ? selectedAnswer.stufe : null;
      const sourceLevel = typeof source?.stufe === "number" ? source.stufe : null;

      if (selectedLevel == null || sourceLevel == null || selectedLevel <= sourceLevel) {
        return [];
      }

      return [{
        frageId: selection.frageId,
        frageText: selection.frageText || question?.frage,
        antwortId: selectedAnswer?.id,
        antwortText: selectedAnswer?.antwort || selection?.antwortText,
        stufe: selectedLevel,
        coveredLevel: sourceLevel,
      }];
    });

    const dedupedCoveringSources = dedupeSourceEntries(coveringSources);

    return {
      ...rec,
      sources: dedupedCoveringSources.length > 0 ? dedupedCoveringSources : lowerSources,
    };
  });
}

function dedupeSourceEntries(entries) {
  const seen = new Set();
  return (Array.isArray(entries) ? entries : []).filter((entry, index) => {
    const key = `${entry?.frageId ?? "q"}-${entry?.antwortId ?? "a"}-${entry?.coveredLevel ?? "c"}-${index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeRecommendations(recommendations) {
  const seen = new Set();
  return (Array.isArray(recommendations) ? recommendations : []).filter((rec, index) => {
    const key = rec?.id ?? rec?.text ?? `rec-${index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default SurveyResultPage;
