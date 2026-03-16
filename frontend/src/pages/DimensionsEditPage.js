import React, { useState, useRef, useEffect } from "react";
import data from "../components/data/struktur.json";
import Card_dimensions from "../components/Cards/Card_dimensions";
import { Link } from "react-router-dom";


const DimensionsEditPage = () => {
  const stored = localStorage.getItem("activeDimensions");

  const initialDimensions = stored
    ? data.dimensionen.filter((d) => JSON.parse(stored).includes(d.id))
    : data.dimensionen;

  const [toEdit, setToEdit] = useState(initialDimensions);
  const [notToEdit, setNotToEdit] = useState(
    data.dimensionen.filter((d) => !initialDimensions.includes(d)),
  );

  const [draggedCard, setDraggedCard] = useState(null);
  useEffect(() => {
    const ids = toEdit.map((d) => d.id);
    localStorage.setItem("activeDimensions", JSON.stringify(ids));
  }, [toEdit]);

  const liveRegionRef = useRef(null);

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
      setToEdit((prev) => prev.filter((c) => c.id !== card.id));
      setNotToEdit((prev) => [...prev, card]);
      announce(`"${card.name}" verschoben in Nicht zu bearbeiten`);
    } else {
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
    </div>
  );
};

export default DimensionsEditPage;
