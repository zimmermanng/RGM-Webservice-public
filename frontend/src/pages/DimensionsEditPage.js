import React, { useState, useRef, useEffect } from "react";
import data from "../components/data/struktur.json";
import Card_dimensions from "../components/Cards/Card_dimensions";
import { Link } from "react-router-dom";

const DimensionsEditPage = () => {
  // 🔹 gespeicherte aktive IDs aus localStorage
  const stored = localStorage.getItem("activeDimensions");
  const storedIds = stored ? JSON.parse(stored) : [];

  const storedAnswers = JSON.parse(localStorage.getItem("answers") || "{}");

// Nur Pakete anzeigen, die noch in activeDimensions sind UND Antworten haben
const dimensionen = data.dimensionen.filter(d => 
  storedIds.includes(d.id) && storedAnswers[d.id] && Object.keys(storedAnswers[d.id]).length > 0
);
  // 🔹 Initiale Arrays sauber trennen
  const initialToEdit = data.dimensionen.filter((d) => storedIds.includes(d.id));
  const initialNotToEdit = data.dimensionen.filter((d) => !storedIds.includes(d.id));

  const [toEdit, setToEdit] = useState(initialToEdit);
  const [notToEdit, setNotToEdit] = useState(initialNotToEdit);
  const [draggedCard, setDraggedCard] = useState(null);
  const liveRegionRef = useRef(null);

  // 🔹 Sync activeDimensions immer, wenn toEdit sich ändert
  useEffect(() => {
    const ids = toEdit.map((d) => d.id);
    localStorage.setItem("activeDimensions", JSON.stringify(ids));
  }, [toEdit]);

  const handleDragStart = (e, card, fromList) => {
    setDraggedCard({ card, fromList });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e, targetList) => {
    e.preventDefault();
    if (!draggedCard) return;

    moveCard(draggedCard.card, draggedCard.fromList, targetList);
    setDraggedCard(null);
  };

  const moveCard = (card, fromList, toList) => {
    if (fromList === toList) return;

    if (fromList === "toEdit") {
      // 🔹 Entfernen aus "zu bearbeiten"
      setToEdit((prev) => prev.filter((c) => c.id !== card.id));
      setNotToEdit((prev) => [...prev, card]);
      announce(`"${card.name}" verschoben in Nicht zu bearbeiten`);

      // 🔹 Antworten löschen, damit sie in Raw Results nicht mehr erscheinen
      const answers = JSON.parse(localStorage.getItem("answers") || "{}");
      if (answers[card.id]) {
        delete answers[card.id];
        localStorage.setItem("answers", JSON.stringify(answers));
      }
    } else {
      // 🔹 Verschieben zurück nach "zu bearbeiten"
      setNotToEdit((prev) => prev.filter((c) => c.id !== card.id));
      setToEdit((prev) => [...prev, card]);
      announce(`"${card.name}" verschoben in Zu bearbeiten`);
    }
  };

  const announce = (message) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "";
      setTimeout(() => {
        liveRegionRef.current.textContent = message;
      }, 50);
    }
  };

  return (
    <div className="mainContainer">
      <h2>Konfigurationsmodus</h2>
      <div className="editModeWrapper">
        {/* Zu bearbeiten */}
        <div
          className="dropZone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "toEdit")}
        >
          <h4 title="Alle Pakete, die zu Ihrer Abteilung passen">Zu bearbeiten</h4>
          <div className="editGrid">
            {toEdit.map((dimension) => (
              <div
                key={dimension.id}
                draggable
                onDragStart={(e) => handleDragStart(e, dimension, "toEdit")}
              >
                <Card_dimensions
                  title={dimension.name}
                  dimensionId={dimension.id}
                  handlungsfelder={dimension.handlungsfelder}
                  showStartButton={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Nicht zu bearbeiten */}
        <div
          className="dropZone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "notToEdit")}
        >
          <h4 title="Alle Pakete, die nicht zu Ihrer Abteilung passen">Nicht zu bearbeiten</h4>
          <div className="editGrid">
            {notToEdit.map((dimension) => (
              <div
                key={dimension.id}
                draggable
                onDragStart={(e) => handleDragStart(e, dimension, "notToEdit")}
              >
                <Card_dimensions
                  title={dimension.name}
                  dimensionId={dimension.id}
                  handlungsfelder={dimension.handlungsfelder}
                  showStartButton={false}
                  showProgress={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="footer">
        <Link to="/dimensions">
          <button className="finishEditButton">Fertig</button>
        </Link>
      </div>

      {/* 🔹 Live-Region für Accessibility */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        style={{ position: "absolute", left: "-9999px" }}
      />
    </div>
  );
};

export default DimensionsEditPage;
