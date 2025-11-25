import React, { useState, useRef } from "react";
import "./DimensionsPage.css";
import data from "../components/data/struktur.json";
import Card from "../components/Cards/Card";

const DimensionsPage = ({activeCompany}) => {
  const [toEdit, setToEdit] = useState(data.dimensionen);
  const [notToEdit, setNotToEdit] = useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [editMode, setEditMode] = useState(true);
  const liveRegionRef = useRef(null); 
  const toggleEditMode = () => setEditMode(!editMode);

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

    // Fokus nach Verschieben auf Karte setzen
    setTimeout(() => {
      const newFocus = document.getElementById(`card-${card.id}`);
      if (newFocus) newFocus.focus();
    }, 100);
  };

  const announce = (message) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "";
      setTimeout(() => {
        liveRegionRef.current.textContent = message;
      }, 50);
    }
  };

  const isEditable = activeCompany ==="LMZ";

  return (
    <div className="mainContainer" id="top">
      <h2>Dimensionen</h2>
      <p id="pageDescription">
        Im Bearbeitungsmodus können Sie festlegen, welche Dimensionen für Sie und ihr Team relevant sind und ihr eigenes RGM zusammenstellen.
      </p>

      {isEditable && (
      <div className="editToggle">
        <span id="editModeLabel">Bearbeitungsmodus:</span>
        <button
          className={`toggleButton ${editMode ? "on" : "off"}`}
          role="switch"
          aria-checked={editMode}
          aria-labelledby="editModeLabel"
          onClick={toggleEditMode}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              toggleEditMode();
            }
          }}
        >
          {isEditable && editMode ? "An" : "Aus"}
        </button>
      </div>
      )}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        ref={liveRegionRef}
      />

      {isEditable && editMode ? (
        <div className="editModeWrapper">
          <div
            className="dropZone"
            role="region"
            aria-label="Zu bearbeiten"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "toEdit")}
          >
            <h4>Zu bearbeiten</h4>
            <div className="gridContainer">
              {toEdit.map((dimension) => (
                <div
                  key={dimension.id}
                  id={`card-${dimension.id}`}
                  className="gridItem"
                  role="gridcell"
                  tabIndex="0"
                  draggable
                  aria-grabbed={draggedCard?.card.id === dimension.id}
                  onDragStart={(e) =>
                    handleDragStart(e, dimension, "toEdit")
                  }
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "ArrowRight") {
                      e.preventDefault();
                      moveCard(dimension, "toEdit", "notToEdit");
                    }
                  }}
                >
                  <Card
                    title={dimension.name}
                    list={dimension.handlungsfelder.map((h) => h.name)}
                    link={`/questionnaire/${dimension.id}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div
            className="dropZone"
            role="region"
            aria-label="Nicht zu bearbeiten"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, "notToEdit")}
          >
            <h4>Nicht zu bearbeiten</h4>
            <div className="gridContainer">
              {notToEdit.map((dimension) => (
                <div
                  key={dimension.id}
                  id={`card-${dimension.id}`}
                  className="gridItem"
                  role="gridcell"
                  tabIndex="0"
                  draggable
                  aria-grabbed={draggedCard?.card.id === dimension.id}
                  onDragStart={(e) =>
                    handleDragStart(e, dimension, "notToEdit")
                  }
                  onKeyDown={(e) => {
                     if ((e.ctrlKey || e.metaKey) && e.key === "ArrowLeft") {
                      e.preventDefault();
                      moveCard(dimension, "notToEdit", "toEdit");
                    }
                  }}
                >
                  <Card
                    title={dimension.name}
                    list={dimension.handlungsfelder.map((h) => h.name)}
                    link={`/questionnaire/${dimension.id}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (

        <div
          className="gridContainer"
          role="grid"
          aria-describedby="pageDescription"
        >
          {toEdit.map((dimension) => (
            <div
              key={dimension.id}
              id={`card-${dimension.id}`}
              className="gridItem"
              role="gridcell"
              tabIndex="0"
            >
              <Card
                title={dimension.name}
                list={dimension.handlungsfelder.map(
                  (handlungsfeld) => handlungsfeld.name
                )}
                link={`/questionnaire/${dimension.id}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DimensionsPage;



