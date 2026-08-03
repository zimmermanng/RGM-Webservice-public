import React, { useEffect, useMemo, useState } from "react";
import data from "../components/data/struktur.json";
import dimensionenContent from "../components/data/dimensionen_content.json";
import Card_dimensions from "../components/Cards/Card_dimensions";
import { Link } from "react-router-dom";
import { API_BASE } from "../config.ts";

const DimensionsPage = ({ activeCompany }) => {
  const [activeIds, setActiveIds] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [evaluationName, setEvaluationName] = useState("");

  const isEditable = activeCompany === "LMZ";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, stateRes, evaluationRes] = await Promise.all([
          fetch(`${API_BASE}/session/settings`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/session/current-state`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/evaluation/`, {
            credentials: "include"
          }),
        ]);

        if (
          settingsRes.status === 401 ||
          settingsRes.status === 403 ||
          stateRes.status === 401 ||
          stateRes.status === 403
        ) {
          setActiveIds([]);
          setCurrentAnswers({});
          return;
        }

        if (!settingsRes.ok) {
          throw new Error(`Settings-Status ${settingsRes.status}`);
        }

        if (!stateRes.ok) {
          throw new Error(`State-Status ${stateRes.status}`);
        }

        const settings = await settingsRes.json();
        const state = await stateRes.json();
        const evaluation = await evaluationRes.json();

        const loadedIds = Array.isArray(settings.activeDimensions)
          ? settings.activeDimensions
          : [];

        const activeEvaluation = evaluation.evaluationRounds.find(obj => obj.isActive);
        setEvaluationName(activeEvaluation.name)

        setActiveIds(
          Array.isArray(settings.activeDimensions)
            ? settings.activeDimensions
            : [],
        );
        setCurrentAnswers(
          state.currentAnswers && typeof state.currentAnswers === "object"
            ? state.currentAnswers
            : {},
        );
      } catch (error) {
        console.error("Fehler beim Laden der Übersicht:", error);
        setActiveIds([]);
        setCurrentAnswers({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const dimensionen = useMemo(() => {
    if (activeIds === null) return [];

    const filtered =
      activeIds.length === 0
        ? data.dimensionen.filter((d) => d.name === "Allgemein")
        : data.dimensionen.filter((d) => activeIds.includes(d.id));

    return filtered.sort((a, b) => {
      if (a.name === "Allgemein") return -1;
      if (b.name === "Allgemein") return 1;
      return 0;
    });
  }, [activeIds]);

  if (loading) {
    return (
      <div className="mainContainer">
        <p role="status" aria-live="polite">Pakete werden geladen …</p>
      </div>
    );
  }

  return (
    <div className="mainContainer">
      <h1>Übersicht</h1>
      <h2>"{evaluationName}"</h2>
      <p>
        Hier finden Sie die zuvor gewählten Pakete Ihres persönlichen
        Reifegradmodells.
      </p>

      <div className="gridContainer">
        {dimensionen.map((dimension) => {
          const answeredObj = currentAnswers[dimension.id] || {};

          let totalQuestions = 0;
          let answeredCount = 0;

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
          const progress =
            totalQuestions > 0
              ? Math.min(answeredCount / totalQuestions, 1)
              : 0;

          return (
            <div
              key={dimension.id}
              className={`gridItem ${dimension.name === "Allgemein" ? "allgemein" : ""}`}
            >
              <Card_dimensions
                title={dimension.name}
                description={descriptionByDimensionId[dimension.id] || ""}
                dimensionId={dimension.id}
                handlungsfelder={dimension.handlungsfelder}
                progress={progress}
              />
            </div>
          );
        })}
      </div>

      <div className="footerDimension">
        {isEditable && (
          <>
            <div className="editButtonContainer">
              <Link to="/dimensions/bearbeiten" className="button editButton">
                Konfigurationsmodus
              </Link>
            </div>

            <Link to="/rawresults" className="button results">
              Ergebnisse ansehen
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default DimensionsPage;
