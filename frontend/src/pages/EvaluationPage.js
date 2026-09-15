import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config.ts";
import useDialogFocus from "../hooks/useDialogFocus";

const EvaluationPage = () => {
  const navigate = useNavigate();
  const [messungen, setMessungen] = useState([]);
  const [messungenLaden, setMessungenLaden] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [titleSaveStatus, setTitleSaveStatus] = useState({});
  const [dialogError, setDialogError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    id: null,
    name: "",
  });
  const createCancelRef = useRef(null);
  const deleteCancelRef = useRef(null);
  const savedTitlesRef = useRef(new Map());

  // States für die beiden Eingabefelder
  const [neuerTitelInput, setNeuerTitelInput] = useState("");
  const [beschreibungInput, setBeschreibungInput] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${API_BASE}/evaluation/`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Evaluationsrunden konnten nicht geladen werden.");
        }
        const data = await res.json();
        const loadedRounds = Array.isArray(data.evaluationRounds)
          ? data.evaluationRounds.reverse()
          : [];
        savedTitlesRef.current = new Map(
          loadedRounds.map((round) => [round.id, round.name?.trim() || ""]),
        );
        setMessungen(loadedRounds);
      } catch (err) {
        console.error("Fehler beim Laden der Evaluationsrunden:", err);
        setLoadError("Evaluationsrunden konnten nicht geladen werden.");
      } finally {
        setMessungenLaden(false);
      }
    };
    fetchTeams();
  }, []);

  const datumBestimmen = () => {
    let datum = new Date();
    const zeitzone = datum.getTimezoneOffset();
    datum = new Date(datum.getTime() - zeitzone * 60 * 1000);
    return datum.toISOString().split("T")[0];
  };

  const handleNeueMessungClick = () => {
    setNeuerTitelInput("");
    setBeschreibungInput("");
    setDialogError("");
    setActionMessage("");
    setConfirmDialog({ open: true });
  };

  const handleCancel = () => {
    setConfirmDialog({ open: false });
    setDeleteDialog({ open: false, id: null, name: "" });
    setDialogError("");
  };

  const createDialogRef = useDialogFocus(confirmDialog.open, {
    initialFocusRef: createCancelRef,
    onClose: handleCancel,
  });
  const deleteDialogRef = useDialogFocus(deleteDialog.open, {
    initialFocusRef: deleteCancelRef,
    onClose: handleCancel,
  });

  const handleConfirm = async () => {
    const tagesdatum = datumBestimmen();
    const titelFürNeueMessung =
      neuerTitelInput.trim() !== "" ? neuerTitelInput : "Unbenannte Messung";

    const neueMessung = {
      id: Date.now(),
      titel: titelFürNeueMessung,
      beschreibung: beschreibungInput,
      erstelltAm: tagesdatum,
    };

    setActionBusy(true);
    setDialogError("");
    try {
      const evaluationen = await createNewEvaluation(neueMessung);
      const updatedRounds = Array.isArray(evaluationen.evaluationRounds)
        ? evaluationen.evaluationRounds.reverse()
        : [];
      savedTitlesRef.current = new Map(
        updatedRounds.map((round) => [round.id, round.name?.trim() || ""]),
      );
      setMessungen(updatedRounds);
      setConfirmDialog({ open: false });
      setActionMessage("Die neue Evaluationsrunde wurde erstellt.");
    } catch (error) {
      console.error("Fehler beim Erstellen der Evaluationsrunde:", error);
      setDialogError(
        error.message ||
          "Die Evaluationsrunde konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
      );
    } finally {
      setActionBusy(false);
    }
  };

  const handleTitelChange = (id, neuerTitel) => {
    setMessungen((currentRounds) =>
      currentRounds.map((messung) =>
        messung.id === id ? { ...messung, name: neuerTitel } : messung,
      ),
    );
    setTitleSaveStatus((current) => ({
      ...current,
      [id]: { text: "", type: "status" },
    }));
  };

  const openDeleteDialog = (id, name) => {
    setDialogError("");
    setActionMessage("");
    setDeleteDialog({ open: true, id: id, name: name });
  };

  const openEvaluation = (id) => {
    navigate(`/evaluationsrunden/gesamtauswertung?id=${id}`);
  };

  const createNewEvaluation = async (evalauion) => {
    const evaluationData = evalauion;
    const createEvaluation = await fetch(
      `${API_BASE}/evaluation/create-evaluation`,
      {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evaluationName: evaluationData.titel,
          date: evaluationData.erstelltAm,
        }),
      },
    );
    const data = await createEvaluation.json();
    if (!createEvaluation.ok || !data.ok) {
      throw new Error(
        data.message ||
          "Die Evaluationsrunde konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
      );
    }
    return data;
  };

  const updateTitle = async (id, title) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleSaveStatus((current) => ({
        ...current,
        [id]: {
          text: "Der Name darf nicht leer sein. Bitte geben Sie einen Namen ein.",
          type: "error",
        },
      }));
      return;
    }

    if (trimmedTitle === savedTitlesRef.current.get(id)) {
      setTitleSaveStatus((current) => ({
        ...current,
        [id]: { text: "", type: "status" },
      }));
      return;
    }

    setTitleSaveStatus((current) => ({
      ...current,
      [id]: { text: "Name wird gespeichert …", type: "status" },
    }));

    try {
      const response = await fetch(`${API_BASE}/evaluation/change-name`, {
        credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id, evaluationName: trimmedTitle }),
      });
      if (!response.ok) {
        throw new Error("Name konnte nicht gespeichert werden.");
      }
      savedTitlesRef.current.set(id, trimmedTitle);
      setMessungen((currentRounds) =>
        currentRounds.map((round) =>
          round.id === id ? { ...round, name: trimmedTitle } : round,
        ),
      );
      setTitleSaveStatus((current) => ({
        ...current,
        [id]: { text: "Name gespeichert", type: "status" },
      }));
    } catch (error) {
      console.error("Fehler beim Speichern des Namens:", error);
      setTitleSaveStatus((current) => ({
        ...current,
        [id]: {
          text: "Der Name konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
          type: "error",
        },
      }));
    }
  };

  const deleteEvaluation = async (id) => {
    setActionBusy(true);
    setDialogError("");
    try {
      const response = await fetch(`${API_BASE}/evaluation/delete-evaluation`, {
        credentials: "include",
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ||
            "Die Evaluationsrunde konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
        );
      }
      const updatedRounds = Array.isArray(data.evaluationRounds)
        ? data.evaluationRounds.reverse()
        : [];
      savedTitlesRef.current = new Map(
        updatedRounds.map((round) => [round.id, round.name?.trim() || ""]),
      );
      setMessungen(updatedRounds);
      setDeleteDialog({ open: false, id: null, name: "" });
      setActionMessage("Die Evaluationsrunde wurde gelöscht.");
    } catch (error) {
      console.error("Fehler beim Löschen der Evaluationsrunde:", error);
      setDialogError(error.message);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="mainContainer">
      <p
        className="readOnlyTag"
        id="evaluation-access-mode"
        aria-label="Zugriffsmodus: Administration"
      >
        Admin
      </p>
      <h1 aria-describedby="evaluation-access-mode">Evaluationsrunden</h1>
      <p>
        Sehen Sie die Ergebnisse abgeschlossener Evaluationsrunden erneut ein
        oder legen Sie eine neue Evaluationsrunde an.
      </p>
      {actionMessage && (
        <p
          className="evaluation-action-status"
          role="status"
          aria-live="polite"
        >
          {actionMessage}
        </p>
      )}

      <div className="centerContainer">
        <button onClick={handleNeueMessungClick} className="homeButton">
          + Neue Messung
        </button>
      </div>

      {messungenLaden && (
        <p role="status" aria-live="polite">
          Evaluationsrunden werden geladen …
        </p>
      )}
      {loadError && (
        <p className="access-error" role="alert">
          {loadError}
        </p>
      )}
      {!messungenLaden && !loadError && (
        <div className="evaluationList">
          {messungen.length === 0 && (
            <p role="status">Keine Evaluationsrunden vorhanden.</p>
          )}
          {messungen.map((messung) => {
            // const titleId = `evaluation-name-${messung.id}`;
            // const helpId = `evaluation-name-help-${messung.id}`;
            const statusId = `evaluation-status-${messung.id}`;
            const saveStatusId = `evaluation-name-save-${messung.id}`;
            const currentSaveStatus = titleSaveStatus[messung.id];

            return (
              <section
                key={messung.id}
                className="homeIntroCard evaluationCard"
                role="group"
                aria-label="Evaluationsrunde"
                aria-describedby={statusId}
              >
                <div className="cardContent">
                  {messung.isActive && (
                    <span className="activeLabel" id={statusId}>
                      Status: Aktiv
                    </span>
                  )}
                  {!messung.isActive && (
                    <span id={statusId} className="activeLabel completedLabel">
                      Status: Abgeschlossen
                    </span>
                  )}

                  <div className="title-edit-container">
                    <label
                      htmlFor={`title-input-${messung.id}`}
                      className="evaluation-title-label"
                    >
                      Name der Evaluationsrunde
                    </label>
                    <div className="title-input-wrapper">
                      <div className="input-icon-wrapper">
                        <input
                          id={`title-input-${messung.id}`}
                          className="titleInputElegant"
                          type="text"
                          value={messung.name}
                          onChange={(e) =>
                            handleTitelChange(messung.id, e.target.value)
                          }
                          aria-describedby={saveStatusId}
                          title="Name bearbeiten"
                        />
                        <svg
                          className="edit-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </div>
                      {savedTitlesRef.current.get(messung.id) !==
                        messung.name.trim() && (
                        <button
                          className="saveTitleButton"
                          onClick={() => updateTitle(messung.id, messung.name)}
                        >
                          Speichern
                        </button>
                      )}
                    </div>
                    {currentSaveStatus && currentSaveStatus.text && (
                      <p
                        id={saveStatusId}
                        className={
                          currentSaveStatus.type === "error"
                            ? "error-text"
                            : "status-text"
                        }
                        role="status"
                        aria-live="polite"
                      >
                        {currentSaveStatus.text}
                      </p>
                    )}
                  </div>

                  {messung.beschreibung && (
                    <p className="evaluationDescription">
                      {messung.beschreibung}
                    </p>
                  )}

                  <div className="timestampContainer">
                    <p>
                      <strong>Erstellt am:</strong> {messung.createdAt}
                    </p>
                    <p>
                      <strong>Zuletzt bearbeitet am:</strong>{" "}
                      {messung.updatedAt}
                    </p>
                  </div>
                  <div className="modalButtons">
                    {!messung.isActive && (
                      <button
                        onClick={() =>
                          openDeleteDialog(messung.id, messung.name)
                        }
                      >
                        Löschen
                      </button>
                    )}
                    <button onClick={() => openEvaluation(messung.id)}>
                      Ergebnis anzeigen
                    </button>
                  </div>
                  {/* Prio2 <p className="downloadLink">Zwischenstand herunterladen:</p> */}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {confirmDialog.open && (
        <div className="modalOverlay" role="presentation">
          <div
            ref={createDialogRef}
            className="modal"
            role="dialog"
            aria-labelledby="create-evaluation-title"
            aria-describedby={`create-evaluation-hint${dialogError ? " create-evaluation-error" : ""}`}
            aria-modal="true"
            tabIndex={-1}
          >
            <h2 id="create-evaluation-title">Erstellen</h2>

            <div className="modalInputGroup">
              <label htmlFor="new-evaluation-title">
                Titel der neuen Messung
              </label>
              <input
                id="new-evaluation-title"
                type="text"
                value={neuerTitelInput}
                onChange={(e) => setNeuerTitelInput(e.target.value)}
                placeholder="Titel der neuen Messung eingeben..."
                className="modalInput"
              />
              <p className="hint" id="create-evaluation-hint">
                Hinweis: Mit der Erstellung einer neuen Messung wird die
                vorherige Messung beendet und kann nicht mehr bearbeitet werden.
                Die Ergebnisse der beendeten Messung bleiben weiterhin
                einsehbar.
              </p>
              {dialogError && (
                <p
                  className="error-text"
                  id="create-evaluation-error"
                  role="alert"
                >
                  {dialogError}
                </p>
              )}
            </div>

            <div className="modalButtons">
              <button
                ref={createCancelRef}
                onClick={handleCancel}
                disabled={actionBusy}
              >
                Abbrechen
              </button>
              <button onClick={handleConfirm} disabled={actionBusy}>
                {actionBusy ? "Wird erstellt …" : "Erstellen"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteDialog.open && (
        <div className="modalOverlay" role="presentation">
          <div
            ref={deleteDialogRef}
            className="modal"
            role="alertdialog"
            aria-labelledby="delete-evaluation-title"
            aria-describedby={`delete-evaluation-description${dialogError ? " delete-evaluation-error" : ""}`}
            aria-modal="true"
            tabIndex={-1}
          >
            <h2 id="delete-evaluation-title">Löschen</h2>
            <p id="delete-evaluation-description">
              Sind Sie sicher, dass Sie die Messung "<i>{deleteDialog.name}</i>"
              löschen möchten? Alle Ergebnisse gehen dadurch verloren und können
              nicht wiederhergestellt werden.
            </p>
            {dialogError && (
              <p
                className="error-text"
                id="delete-evaluation-error"
                role="alert"
              >
                {dialogError}
              </p>
            )}
            <div className="modalButtons">
              <button
                ref={deleteCancelRef}
                onClick={handleCancel}
                disabled={actionBusy}
              >
                Evaluationsrunde behalten
              </button>
              <button
                onClick={() => deleteEvaluation(deleteDialog.id)}
                disabled={actionBusy}
              >
                {actionBusy ? "Wird gelöscht …" : "Evaluationsrunde löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationPage;
