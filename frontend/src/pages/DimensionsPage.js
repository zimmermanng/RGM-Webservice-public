import React, { useEffect, useMemo, useState } from "react";
import data from "../components/data/struktur.json";
import Card_dimensions from "../components/Cards/Card_dimensions";
import { Link } from "react-router-dom";

const API_BASE = "/api";

const DimensionsPage = ({ activeCompany }) => {
  const [activeIds, setActiveIds] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  const isEditable = activeCompany === "LMZ";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, stateRes] = await Promise.all([
          fetch(`${API_BASE}/session/settings`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/session/current-state`, {
            credentials: "include",
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

        setActiveIds(
          Array.isArray(settings.activeDimensions) ? settings.activeDimensions : []
        );
        setCurrentAnswers(
          state.currentAnswers && typeof state.currentAnswers === "object"
            ? state.currentAnswers
            : {}
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

  const dimensionen = useMemo(() => {
    if (activeIds === null) return [];
    if (activeIds.length === 0) return data.dimensionen;
    return data.dimensionen.filter((d) => activeIds.includes(d.id));
  }, [activeIds]);

  const allCompleted =
    dimensionen.length > 0 &&
    dimensionen.every((dimension) => {
      const answeredObj = currentAnswers[dimension.id] || {};
      const answeredCount = Object.keys(answeredObj).length;

      const totalQuestions = dimension.handlungsfelder.reduce(
        (sum, hf) => sum + (hf.fragen?.length || 0),
        0
      );

      return totalQuestions > 0 && answeredCount === totalQuestions;
    });

  if (loading) {
    return (
      <div className="mainContainer">
        <p>Lade Pakete...</p>
      </div>
    );
  }

  return (
    <div className="mainContainer">
      <h2>Übersicht</h2>
      <p>
        Hier finden Sie ihre zuvor gewählten Pakete Ihres persönlichen
        Reifegradmodells.
      </p>

      <div className="gridContainer">
        {dimensionen.map((dimension) => {
          const answeredObj = currentAnswers[dimension.id] || {};
          const answeredCount = Object.keys(answeredObj).length;

          const totalQuestions = dimension.handlungsfelder.reduce(
            (sum, hf) => sum + (hf.fragen?.length || 0),
            0
          );

          const progress =
            totalQuestions > 0 ? answeredCount / totalQuestions : 0;

          return (
            <div key={dimension.id} className="gridItem">
              <Card_dimensions
                title={dimension.name}
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
              <Link to="/dimensions/bearbeiten">
                <button className="editButton">Konfigurationsmodus</button>
              </Link>
            </div>

            <Link to="/rawresults">
              <button className="results" disabled={!allCompleted}>
                Ergebnisse ansehen
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default DimensionsPage;