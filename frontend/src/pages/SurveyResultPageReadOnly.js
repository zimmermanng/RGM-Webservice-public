import React, { useEffect, useMemo, useRef, useState } from "react";
import RadialBarChart from "../components/radialBarChart";
import DataTable from "../components/DataTable";
import fragenData from "../components/data/fragen.json";
import handlungsempfehlungenData from "../components/data/handlungsempfehlungen.json";

const SurveyResultPageReadOnly = ({ surveyResults, activeCompany }) => {
  const [viewMode, setViewMode] = useState("chart");
  const [selectedTab, setSelectedTab] = useState(null);
  const [visibleLevels, setVisibleLevels] = useState(
    new Set([-1, 0, 1, 2, 3, 4])
  );
  const tabRefs = useRef({});

  const questionMap = useMemo(() => buildQuestionMap(fragenData), []);

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

function slugifyId(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export default SurveyResultPageReadOnly;