import React from "react";
import data from "../components/data/struktur.json";
import Card_dimensions from "../components/Cards/Card_dimensions";
import { Link } from "react-router-dom";

const DimensionsPage = ({ activeCompany }) => {
  const stored = localStorage.getItem("activeDimensions");
  const activeIds = stored ? JSON.parse(stored) : null;

  const dimensionen = activeIds
    ? data.dimensionen.filter((d) => activeIds.includes(d.id))
    : data.dimensionen;

  const isEditable = activeCompany === "LMZ";

  // 🔹 Antworten aus localStorage laden
  const storedAnswers = JSON.parse(localStorage.getItem("answers") || "{}");

  return (
    <div className="mainContainer">
      <h2>Übersicht</h2>
      <p>
        Hier finden Sie ihre zuvor gewählten Pakete Ihres persönlichen
        Reifegradmodells.
      </p>
      <div className="gridContainer">
        {dimensionen.map((dimension) => {
          // 🔹 Antworten für diese Dimension
          const answeredObj = storedAnswers[dimension.id] || {};
          const answeredCount = Object.keys(answeredObj).length;

          // 🔹 Gesamtanzahl Fragen dieser Dimension
          const totalQuestions = dimension.handlungsfelder.reduce(
            (sum, hf) => sum + (hf.fragen?.length || 0),
            0,
          );

          const progress =
            totalQuestions > 0 ? answeredCount / totalQuestions : 0;

          return (
            <div key={dimension.id} className="gridItem">
              <Card_dimensions
                title={dimension.name}
                dimensionId={dimension.id}
                handlungsfelder={dimension.handlungsfelder}
                progress={progress} // 🔹 Fortschritt übergeben
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
                <button className="editButton">Konfigurationsmodus ←</button>
              </Link>
            </div>

            <button className="results"> Ergebnisse ansehen →</button>
          </>
        )}
      </div>
    </div>
  );
};

export default DimensionsPage;
