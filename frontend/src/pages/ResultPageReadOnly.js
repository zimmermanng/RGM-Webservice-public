import React, { useEffect, useState, useMemo } from "react";
import SurveyResultPageReadOnly from "./SurveyResultPageReadOnly.js";
import struktur from "../components/data/struktur.json";
import { API_BASE } from "../config.ts";
import Card_dimensions from "../components/Cards/Card_dimensions.js";
import dimensionenContent from "../components/data/dimensionen_content.json";

const ResultPageReadOnly = () => {
  const [surveyResults, setSurveyResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDimensions, setActiveDimensions] = useState([]);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [resultsRes, settingsRes, stateRes] = await Promise.all([
          fetch(`${API_BASE}/session/results`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/session/settings`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/session/current-state`, {
            credentials: "include",
          }),
        ]);

        if (!resultsRes.ok) {
          throw new Error(
            `Ergebnisse konnten nicht geladen werden (${resultsRes.status})`,
          );
        }

        if (!settingsRes.ok) {
          throw new Error(
            `Einstellungen konnten nicht geladen werden (${settingsRes.status})`,
          );
        }

        const resultsData = await resultsRes.json();
        const settingsData = await settingsRes.json();
        const stateData = await stateRes.json();

        setTeamName(resultsData.team);
        setCurrentAnswers(
          stateData.currentAnswers &&
            typeof stateData.currentAnswers === "object"
            ? stateData.currentAnswers
            : {},
        );

        const normalizedEntries = normalizeResponseToEntries(resultsData);

        const activeIds = Array.isArray(settingsData.activeDimensions)
          ? settingsData.activeDimensions
          : [];
        const filteredDimensions = (
          activeIds.length === 0
            ? struktur.dimensionen.filter((d) => d.name === "Allgemein")
            : struktur.dimensionen.filter((d) => activeIds.includes(d.id))
        ).sort((a, b) => {
          if (a.name === "Allgemein") return -1;
          if (b.name === "Allgemein") return 1;
          return 0;
        });

        setActiveDimensions(filteredDimensions);

        const idToName = struktur.dimensionen.reduce((acc, d) => {
          acc[d.id] = d.name;
          return acc;
        }, {});

        const activeNames = activeIds.map((id) => idToName[id]).filter(Boolean);

        const filteredEntries =
          activeNames.length === 0
            ? normalizedEntries
            : normalizedEntries.map((entry) => ({
                ...entry,
                results: (entry.results || []).filter((r) =>
                  activeNames.includes(r.group),
                ),
                selections: (entry.selections || []).filter((s) =>
                  activeNames.includes(s.group),
                ),
              }));

        const combined = combineEntries(filteredEntries);

        if (combined) {
          setSurveyResults({
            ...combined,
            team: resultsData?.team || combined?.team || null,
          });
        } else {
          setSurveyResults(null);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Session-Daten:", err);
        setError("Ergebnisse konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const descriptionByDimensionId = useMemo(() => {
    const entries = Array.isArray(dimensionenContent?.dimensionen)
      ? dimensionenContent.dimensionen
      : [];

    return entries.reduce((acc, item) => {
      if (item?.id) {
        acc[item.id] = item.beschreibung || "";
      }
      return acc;
    }, {});
  }, []);

  if (loading) {
    return <p role="status" aria-live="polite">Ergebnisse werden geladen …</p>;
  }
  if (error) {
    return <p className="access-error" role="alert">{error}</p>;
  }
  if (!surveyResults) {
    return <p className="noResults" role="status">Noch keine Ergebnisse vorhanden.</p>;
  }

  return (
    <div className="mainContainer">
      <p
        className="readOnlyTag"
        id="results-access-mode"
        aria-label="Ansichtsmodus: Lesemodus, nur Lesezugriff"
      >
        Lesemodus
      </p>
      <h1 aria-describedby="results-access-mode">Ergebnisse {teamName}</h1>
      <p>
        Hier finden Sie die gewählten Pakete und die errechneten Ergebnisse der
        ausgewählten Organisationseinheit.
      </p>
      <p>Sie haben keinen Bearbeitungszugriff!</p>
      <div className="gridContainer">
        {activeDimensions.map((dimension) => {
          const answeredObj = currentAnswers[dimension.id] || {};

          let totalQuestions = 0;
          let answeredCount = 0;

          // Sichere Berechnung: Zähle nur Antworten zu existierenden Fragen
          if (Array.isArray(dimension.handlungsfelder)) {
            dimension.handlungsfelder.forEach((hf) => {
              if (Array.isArray(hf.fragen)) {
                totalQuestions += hf.fragen.length;

                hf.fragen.forEach((frage) => {
                  if (
                    answeredObj[frage.id] !== undefined &&
                    answeredObj[frage.id] !== null &&
                    answeredObj[frage.id] !== ""
                  ) {
                    answeredCount++;
                  }
                });
              }
            });
          }

          // Deckelung auf maximal 1 (100%)
          const progress =
            totalQuestions > 0
              ? Math.min(answeredCount / totalQuestions, 1)
              : 0;

          return (
            <div
              key={dimension.id}
              className={`gridItem ${
                dimension.name === "Allgemein" ? "allgemein" : ""
              }`}
            >
              <Card_dimensions
                title={dimension.name}
                description={descriptionByDimensionId[dimension.id] || ""}
                dimensionId={dimension.id}
                handlungsfelder={dimension.handlungsfelder}
                progress={progress}
                showProgress={true}
                showStartButton={false}
              />
            </div>
          );
        })}
      </div>

      <div className="packagesSection">
        <SurveyResultPageReadOnly surveyResults={surveyResults} />
      </div>
    </div>
  );
};

function normalizeResponseToEntries(data) {
  if (Array.isArray(data?.results)) {
    return data.results.map((entry) => entry?.data ?? entry).filter(Boolean);
  }

  if (Array.isArray(data)) {
    return data.map((entry) => entry?.data ?? entry).filter(Boolean);
  }

  if (data?.data) {
    return [data.data].filter(Boolean);
  }

  return data ? [data] : [];
}

function combineEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const sortedEntries = [...entries].sort((a, b) => {
    const ta = new Date(a?.timestamp || a?.savedAt || 0).getTime();
    const tb = new Date(b?.timestamp || b?.savedAt || 0).getTime();
    return ta - tb;
  });

  const resultsByKey = new Map();
  const selectionsByQuestionId = new Map();
  const allComments = [];

  sortedEntries.forEach((entry) => {
    (Array.isArray(entry?.results) ? entry.results : []).forEach((row) => {
      const key = `${row.group}__${row.category}`;
      resultsByKey.set(key, row);
    });

    (Array.isArray(entry?.selections) ? entry.selections : []).forEach(
      (selection) => {
        const key = selection.frageId;
        selectionsByQuestionId.set(key, selection);
      },
    );

    if (Array.isArray(entry?.comments) && entry.comments.length > 0) {
      allComments.push(...entry.comments);
    }
  });

  const latest = sortedEntries[sortedEntries.length - 1] || null;

  return {
    ...latest,
    results: Array.from(resultsByKey.values()),
    selections: Array.from(selectionsByQuestionId.values()),
    comments: allComments,
    timestamp: latest?.timestamp || latest?.savedAt || new Date().toISOString(),
  };
}

export default ResultPageReadOnly;
