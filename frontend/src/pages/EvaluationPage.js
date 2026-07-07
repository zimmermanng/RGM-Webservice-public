import React, { useState } from "react";
// import { API_BASE } from "../config.ts";

const EvaluationPage = () => {
  const [messungen, setMessungen] = useState([]);
  const [aktiveID, setAktiveID] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  
  // States für die beiden Eingabefelder
  const [neuerTitelInput, setNeuerTitelInput] = useState("");
  const [beschreibungInput, setBeschreibungInput] = useState("");

  const handleNeueMessungClick = () => {
    setNeuerTitelInput("");
    setBeschreibungInput("");
    setConfirmDialog({ open: true });
  };

  const handleCancel = () => {
    setConfirmDialog({ open: false });
  };

  const handleConfirm = () => {
    const tagesdatum = new Date().toLocaleDateString("de-DE");

    const titelFürNeueMessung = neuerTitelInput.trim() !== "" ? neuerTitelInput : "Unbenannte Messung";

    const neueMessung = {
      id: Date.now(),
      titel: titelFürNeueMessung, 
      beschreibung: beschreibungInput, 
      erstelltAm: tagesdatum,
    };

    setMessungen([neueMessung, ...messungen]);
    setAktiveID(neueMessung.id);
    
    setConfirmDialog({ open: false });
  };

  const handleTitelChange = (id, neuerTitel) => {
    setMessungen(
      messungen.map((messung) =>
        messung.id === id ? { ...messung, titel: neuerTitel } : messung,
      ),
    );
  };

  return (
    <div className="mainContainer">
      <div className="readOnlyTag">Admin</div>
      <h2>Evaluationsrunden</h2>
      <p>
        Sehen Sie die Ergebnisse abgeschlossener Evaluationsrunden erneut ein
        oder legen Sie eine neue Evaluationsrunde an.
      </p>

      <div className="centerContainer">
        <button onClick={handleNeueMessungClick} className="homeButton">
          Neue Messung
        </button>
      </div>

      <div className="evaluationList">
        {messungen.map((messung) => (
          <section key={messung.id} className="homeIntroCard evaluationCard">
            <div className="cardContent">
              {aktiveID === messung.id && (
                <span className="activeLabel">Aktiv</span>
              )}

              <input
                type="text"
                value={messung.titel}
                onChange={(e) => handleTitelChange(messung.id, e.target.value)}
                className="editableTitle"
              />
              
              {messung.beschreibung && (
                <p className="evaluationDescription">{messung.beschreibung}</p>
              )}

              <div className="timestampContainer">
                <p>
                  <strong>Erstellt am:</strong> {messung.erstelltAm}
                </p>
                <p>
                  <strong>Zuletzt bearbeitet am:</strong> -
                </p>
              </div>
              <div className="modalButtons">
                {/* Hier fehlt noch die Funktion zum löschen, macht aber denke erst mit dem Backend sinn, dann kann es direkt auch aus der Datenbank wieder gelöscht werden. */}
                {aktiveID !== messung.id && (
                  <button>Löschen</button>
                )}
              </div>
              {/* Prio2 <p className="downloadLink">Zwischenstand herunterladen:</p> */}
            </div>
          </section>
        ))}
      </div>


      {confirmDialog.open && (
        <div className="modalOverlay" role="dialog" aria-labelledby="modal-title" aria-modal="true">
          <div className="modal">
            <h2>Erstellen</h2>
            
            <div className="modalInputGroup">
              <input
                type="text"
                value={neuerTitelInput}
                onChange={(e) => setNeuerTitelInput(e.target.value)}
                placeholder="Titel der neuen Messung eingeben..."
                className="modalInput"
                autoFocus 
              />
             <p className="hint">
              Hinweis:
              Mit der Erstellung einer neuen Messung wird die vorherige Messung beendet und kann nicht mehr bearbeitet werden. Die Ergebnisse der beendeten Messung bleiben weiterhin einsehbar.
             </p>
            </div>

            <div className="modalButtons">
              <button onClick={handleCancel}>
                Abbrechen
              </button>
              <button onClick={handleConfirm}>
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationPage;
