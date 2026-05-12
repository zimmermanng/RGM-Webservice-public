import React, { useEffect, useRef, useState, useMemo } from "react";
import data from "../components/data/struktur.json";
import Card_dimensions from "../components/Cards/Card_dimensions";
import { Link, useNavigate } from "react-router-dom";
import dimensionenContent from "../components/data/dimensionen_content.json";
import { API_BASE } from "../config.ts";

const DimensionsEditPage = () => {
  const navigate = useNavigate();
  const [toEdit, setToEdit] = useState([]);
  const [notToEdit, setNotToEdit] = useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeoutRef = useRef(null);

  const liveRegionRef = useRef(null);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    card: null,
  });

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

  const getProgress = (dimension) => {
    const answeredObj = currentAnswers[dimension.id] || {};
    const answeredCount = Object.keys(answeredObj).length;

    const totalQuestions = dimension.handlungsfelder.reduce(
      (sum, hf) => sum + (hf.fragen?.length || 0),
      0,
    );

    return totalQuestions > 0 ? answeredCount / totalQuestions : 0;
  };

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

        if (settingsRes.status === 401 || stateRes.status === 401) {
          navigate("/login");
          return;
        }

        if (settingsRes.status === 403 || stateRes.status === 403) {
          navigate("/team-select");
          return;
        }

        if (!settingsRes.ok) {
          throw new Error(`Settings-Status ${settingsRes.status}`);
        }

        if (!stateRes.ok) {
          throw new Error(`State-Status ${stateRes.status}`);
        }

        const settingsResult = await settingsRes.json();
        const stateResult = await stateRes.json();

        const activeIds = Array.isArray(settingsResult.activeDimensions)
          ? settingsResult.activeDimensions
          : [];

        const loadedAnswers =
          stateResult.currentAnswers &&
          typeof stateResult.currentAnswers === "object"
            ? stateResult.currentAnswers
            : {};

        const filteredDimensions = data.dimensionen.filter(
          (d) => d.name !== "Allgemein",
        );

        const initialToEdit =
          activeIds.length > 0
            ? filteredDimensions.filter((d) => activeIds.includes(d.id))
            : [];

        const initialNotToEdit = filteredDimensions.filter(
          (d) => !initialToEdit.some((x) => x.id === d.id),
        );

        setToEdit(initialToEdit);
        setNotToEdit(initialNotToEdit);
        setCurrentAnswers(loadedAnswers);
      } catch (error) {
        console.error("Fehler beim Laden der Konfiguration:", error);
        setToEdit([]);
        setNotToEdit(data.dimensionen);
        setCurrentAnswers({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

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

  // Tastatur-Handler für barrierefreies Verschieben
  const handleKeyDown = (e, card, fromList, targetList) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); // Verhindert das Scrollen der Seite bei der Leertaste
      moveCard(card, fromList, targetList);
    }
  };

  const moveCard = (card, fromList, toList) => {
    if (fromList === toList) return;
    if (fromList === "toEdit") {
      const hasAnswers =
        currentAnswers[card.id] &&
        Object.keys(currentAnswers[card.id]).length > 0;

      if (hasAnswers) {
        setConfirmDialog({ open: true, card });
        return;
      }

      performMove(card);
    } else {
      setNotToEdit((prev) => prev.filter((c) => c.id !== card.id));
      setToEdit((prev) => [...prev, card]);
      announce(`Paket "${card.name}" wurde nach "Ausgewählt" verschoben.`);
    }
  };

  const performMove = (card) => {
    setToEdit((prev) => prev.filter((c) => c.id !== card.id));
    setNotToEdit((prev) => [...prev, card]);

    setCurrentAnswers((prev) => {
      const next = { ...prev };
      delete next[card.id];
      return next;
    });

    announce(`Paket "${card.name}" wurde nach "Nicht ausgewählt" verschoben.`);
  };

  const handleConfirm = () => {
    performMove(confirmDialog.card);
    setConfirmDialog({ open: false, card: null });
    // Nach Bestätigung den Fokus idealerweise auf etwas Sinnvolles setzen
    document.getElementById("editGrid-notToEdit")?.focus();
  };

  const handleCancel = () => {
    setConfirmDialog({ open: false, card: null });
  };

  const announce = (message) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = "";
      setTimeout(() => {
        liveRegionRef.current.textContent = message;
      }, 50);
    }

    setToastMessage(message);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const handleSave = async () => {
    const allgemeinDimension = data.dimensionen.find(
      (d) => d.name === "Allgemein",
    );

    const activeDimensions = [
      allgemeinDimension?.id,
      ...toEdit.map((d) => d.id),
    ].filter(Boolean);

    setSaving(true);

    try {
      const [settingsRes, stateRes] = await Promise.all([
        fetch(`${API_BASE}/session/settings`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activeDimensions }),
        }),
        fetch(`${API_BASE}/session/current-state`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentAnswers }),
        }),
      ]);

      if (settingsRes.status === 401 || stateRes.status === 401) {
        alert("Ihre Sitzung ist nicht mehr gültig. Bitte erneut einloggen.");
        navigate("/login");
        return;
      }

      if (settingsRes.status === 403 || stateRes.status === 403) {
        alert("Bitte zuerst ein Team auswählen.");
        navigate("/team-select");
        return;
      }

      if (!settingsRes.ok) {
        throw new Error(`Settings-Status ${settingsRes.status}`);
      }

      if (!stateRes.ok) {
        throw new Error(`State-Status ${stateRes.status}`);
      }

      navigate("/dimensions");
    } catch (error) {
      console.error("Fehler beim Speichern der Konfiguration:", error);
      alert("Pakete konnten nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mainContainer" aria-busy="true" aria-live="polite">
        <p>Lade Konfiguration...</p>
      </div>
    );
  }

  return (
    <div className="mainContainer">
      <h2>Konfigurationsmodus</h2>

      {/* Unsichtbare Live-Region für Screenreader */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only" // Empfohlen: CSS-Klasse für Visually Hidden anstelle von Inline-Styles
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          border: 0,
        }}
      />

      <div className="editModeWrapper">
        {/* --- ZONE: AUSGEWÄHLT --- */}
        <div
          className="dropZone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "toEdit")}
          aria-labelledby="heading-toEdit"
        >
          <h4
            id="heading-toEdit"
            title="Alle Pakete, die zu Ihrer Abteilung passen"
          >
            Ausgewählt
          </h4>

          <div
            className="editGrid"
            role="list"
            id="editGrid-toEdit"
            tabIndex={-1}
            aria-label="Liste der ausgewählten Pakete"
          >
            {toEdit.length === 0 ? (
              <div className="emptyState" role="listitem">
                Bis jetzt wurden noch keine Pakete ausgewählt
              </div>
            ) : (
              toEdit.map((dimension) => {
                const progress = getProgress(dimension);
                return (
                  <div
                    key={dimension.id}
                    role="listitem"
                    draggable
                    tabIndex={0} // Macht das Element per Tab fokussierbar
                    aria-roledescription="Verschiebbares Element"
                    aria-label={`Paket ${dimension.name}. Drücken Sie Enter oder die Leertaste, um es nach 'Nicht ausgewählt' zu verschieben.`}
                    onDragStart={(e) => handleDragStart(e, dimension, "toEdit")}
                    onKeyDown={(e) =>
                      handleKeyDown(e, dimension, "toEdit", "notToEdit")
                    }
                    style={{ cursor: "grab" }}
                  >
                    <Card_dimensions
                      title={dimension.name}
                      description={descriptionByDimensionId[dimension.id] || ""}
                      dimensionId={dimension.id}
                      handlungsfelder={dimension.handlungsfelder}
                      showStartButton={false}
                      showProgress={true}
                      progress={progress}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* --- ZONE: NICHT AUSGEWÄHLT --- */}
        <div
          className="dropZone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "notToEdit")}
          aria-labelledby="heading-notToEdit"
        >
          <h4
            id="heading-notToEdit"
            title="Alle Pakete, die nicht zu Ihrer Abteilung passen"
          >
            Nicht ausgewählt
          </h4>

          <div
            className="editGrid"
            role="list"
            id="editGrid-notToEdit"
            tabIndex={-1}
            aria-label="Liste der nicht ausgewählten Pakete"
          >
            {notToEdit.map((dimension) => (
              <div
                key={dimension.id}
                role="listitem"
                draggable
                tabIndex={0} // Fokussierbar machen
                aria-roledescription="Verschiebbares Element"
                aria-label={`Paket ${dimension.name}. Drücken Sie Enter oder die Leertaste, um es nach 'Ausgewählt' zu verschieben.`}
                onDragStart={(e) => handleDragStart(e, dimension, "notToEdit")}
                onKeyDown={(e) =>
                  handleKeyDown(e, dimension, "notToEdit", "toEdit")
                }
                style={{ cursor: "grab" }}
              >
                <Card_dimensions
                  title={dimension.name}
                  description={descriptionByDimensionId[dimension.id] || ""}
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
        <button
          className="finishEditButton"
          onClick={handleSave}
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? "Speichern..." : "Fertig"}
        </button>

        <Link to="/dimensions">
          <button className="finishEditButton">Abbrechen</button>
        </Link>
      </div>

      {/* --- CONFIRM DIALOG --- */}
      {confirmDialog.open && (
        <div
          className="modalOverlay"
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          <div className="modal">
            <p id="modal-title">
              Der Bearbeitungsstand von "{confirmDialog.card.name}" wird beim
              Verschieben dieses Pakets zurückgesetzt.
            </p>

            <div className="modalButtons">
              <button onClick={handleCancel} autoFocus>
                Abbrechen
              </button>
              <button onClick={handleConfirm} className="danger">
                Trotzdem verschieben
              </button>
            </div>
          </div>
        </div>
      )}
      {toastMessage && (
        <div className="toast" aria-hidden="true">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default DimensionsEditPage;
