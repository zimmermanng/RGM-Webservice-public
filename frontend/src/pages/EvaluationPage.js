import React, { useState, useEffect } from "react";
import { API_BASE } from "../config.ts";

const EvaluationPage = () => {
  const [messungen, setMessungen] = useState([]);
  const [messungenLaden, setMessungenLaden] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: "" });

  // States für die beiden Eingabefelder
  const [neuerTitelInput, setNeuerTitelInput] = useState("");
  const [beschreibungInput, setBeschreibungInput] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_BASE}/evaluation/`, {
          credentials: "include",
        });
        const data = await res.json();
        setMessungen(data.evaluationRounds.reverse())
      } catch (err) {
        console.error("Fehler beim Laden der Evaluationsrunden:", err);
      } finally {
        setMessungenLaden(false);
      }
    }
    fetchTeams()
  }, []);

  const datumBestimmen = () => {
    let datum = new Date();
    const zeitzone = datum.getTimezoneOffset();
    datum = new Date(datum.getTime() - (zeitzone * 60 * 1000));
    return datum.toISOString().split('T')[0];
  };

  const handleNeueMessungClick = () => {
    setNeuerTitelInput("");
    setBeschreibungInput("");
    setConfirmDialog({ open: true });
  };

  const handleCancel = () => {
    setConfirmDialog({ open: false });
    setDeleteDialog({ open: false, id: null, name: "" });
  };

  const handleConfirm = async () => {
    const tagesdatum = datumBestimmen()
    const titelFürNeueMessung = neuerTitelInput.trim() !== "" ? neuerTitelInput : "Unbenannte Messung";

    const neueMessung = {
      id: Date.now(),
      titel: titelFürNeueMessung,
      beschreibung: beschreibungInput,
      erstelltAm: tagesdatum,
    };

    const evaluationen = await createNewEvaluation(neueMessung)
    if (evaluationen.ok) setMessungen(evaluationen.evaluationRounds.reverse());

    setConfirmDialog({ open: false });
  };

  const handleTitelChange = (id, neuerTitel) => {
    setMessungen(
      messungen.map((messung) =>
        messung.id === id ? { ...messung, name: neuerTitel } : messung,
      ),
    );
  };

  const openDeleteDialog = (id, name) => {
    setDeleteDialog({ open: true, id: id, name: name });
  }

  const createNewEvaluation = async (evalauion) => {
    const evaluationData = evalauion;
    const createEvaluation = await fetch(`${API_BASE}/evaluation/create-evaluation`, {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ evaluationName: evaluationData.titel, date: evaluationData.erstelltAm }),
    });
    const data = await createEvaluation.json()
    return data
  }

  const updateTitle = async (id, title) => {
    await fetch(`${API_BASE}/evaluation/change-name`, {
      credentials: "include",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id, evaluationName: title }),
    });
  }

  const deleteEvaluation = async (id) => {
    const deleteEvaluation = await fetch(`${API_BASE}/evaluation/delete-evaluation`, {
      credentials: "include",
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: id }),
    });
    const data = await deleteEvaluation.json()
    if (data.ok) setMessungen(data.evaluationRounds.reverse());
    setDeleteDialog({ open: false, id: null, name: "" });
  }

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

      {
        !messungenLaden && (
          <div className="evaluationList">
            {messungen.map((messung) => (
              <section key={messung.id} className="homeIntroCard evaluationCard">
                <div className="cardContent">
                  {messung.isActive && (
                    <span className="activeLabel">Aktiv</span>
                  )}

                  <input
                    type="text"
                    value={messung.name}
                    onChange={(e) => handleTitelChange(messung.id, e.target.value)}
                    onBlur={(e) => updateTitle(messung.id, e.target.value)}
                    className="editableTitle"
                  />

                  {messung.beschreibung && (
                    <p className="evaluationDescription">{messung.beschreibung}</p>
                  )}

                  <div className="timestampContainer">
                    <p>
                      <strong>Erstellt am:</strong> {messung.createdAt}
                    </p>
                    <p>
                      <strong>Zuletzt bearbeitet am:</strong> {messung.updatedAt}
                    </p>
                  </div>
                  <div className="modalButtons">
                    {!messung.isActive && (
                      <button onClick={() => openDeleteDialog(messung.id, messung.name)}>Löschen</button>
                    )}
                  </div>
                  {/* Prio2 <p className="downloadLink">Zwischenstand herunterladen:</p> */}
                </div>
              </section>
            ))}
          </div>
        )
      }

      {
        confirmDialog.open && (
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
        )
      }
      {
        deleteDialog.open && (
          <div className="modalOverlay" role="dialog" aria-labelledby="modal-title" aria-modal="true">
            <div className="modal">
              <h2>Löschen</h2>
              <p>Sind Sie sicher, dass Sie die Messung "<i>{deleteDialog.name}</i>" löschen möchten?
                Alle Ergebnisse gehen dadurch verloren und können nicht wiederhergestellt werden.</p>
              <div className="modalButtons">
                <button onClick={handleCancel}>
                  Abbrechen
                </button>
                <button onClick={() => deleteEvaluation(deleteDialog.id)}>
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default EvaluationPage;
