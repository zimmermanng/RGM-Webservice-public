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
  const [lockedCards, setLockedCards] = useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Zeigt nun "Live-Speichern" an
  const [toastMessage, setToastMessage] = useState("");
  const [showLock, setShowLock] = useState(false)
  const toastTimeoutRef = useRef(null);
  const scrollIntervalRef = useRef(null);
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
          fetch(`${API_BASE}/session/settings`, { credentials: "include" }),
          fetch(`${API_BASE}/session/current-state`, { credentials: "include" }),
        ]);

        if (settingsRes.status === 401 || stateRes.status === 401) {
          navigate("/login");
          return;
        }
        if (settingsRes.status === 403 || stateRes.status === 403) {
          navigate("/team-select");
          return;
        }

        if (!settingsRes.ok || !stateRes.ok) throw new Error("Ladefehler");

        const settingsResult = await settingsRes.json();
        const stateResult = await stateRes.json()

        console.log(settingsResult)

        const activeIds = Array.isArray(settingsResult.activeDimensions)
          ? settingsResult.activeDimensions
          : [];

        const lockedIds = Array.isArray(settingsResult.lockedDimensions)
          ? settingsResult.lockedDimensions
          : [];

        const loadedAnswers = stateResult.currentAnswers && typeof stateResult.currentAnswers === "object"
            ? stateResult.currentAnswers
            : {};

        const filteredDimensions = data.dimensionen.filter((d) => d.name !== "Allgemein");

        const initialToEdit = activeIds.length > 0
            ? filteredDimensions.filter((d) => activeIds.includes(d.id))
            : [];

        const initialNotToEdit = filteredDimensions.filter((d) => !initialToEdit.some((x) => x.id === d.id));
        
        console.log(initialToEdit)
        console.log(lockedIds)

        setToEdit(initialToEdit);
        setNotToEdit(initialNotToEdit);
        setCurrentAnswers(loadedAnswers);
        setLockedCards(lockedIds)
        setShowLock(settingsResult.privilegedAccess);
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
    window.addEventListener("dragover", handleDragOverWindow);
    window.addEventListener("drop", stopAutoScroll);
    window.addEventListener("dragend", stopAutoScroll);

    return () => {
      window.removeEventListener("dragover", handleDragOverWindow);
      window.removeEventListener("drop", stopAutoScroll);
      window.removeEventListener("dragend", stopAutoScroll);
      clearInterval(scrollIntervalRef.current);
    };
  }, [navigate]);

  // Zentralisierungs-Funktion für das Speichern im Backend
  const saveData = async (nextToEdit, nextAnswers) => {
    const allgemeinDimension = data.dimensionen.find((d) => d.name === "Allgemein");
    const activeDimensions = [
      allgemeinDimension?.id,
      ...nextToEdit.map((d) => d.id),
    ].filter(Boolean);

    setSaving(true);

    try {
      const [settingsRes, stateRes] = await Promise.all([
        fetch(`${API_BASE}/session/settings`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeDimensions }),
        }),
        fetch(`${API_BASE}/session/current-state`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentAnswers: nextAnswers }),
        }),
      ]);

      if (settingsRes.status === 401 || stateRes.status === 401) {
        alert("Ihre Sitzung ist nicht mehr gültig. Bitte erneut einloggen.");
        navigate("/login");
        return false;
      }
      if (settingsRes.status === 403 || stateRes.status === 403) {
        alert("Bitte zuerst ein Team auswählen.");
        navigate("/team-select");
        return false;
      }

      if (!settingsRes.ok || !stateRes.ok) {
        throw new Error("Fehler beim automatischen Speichern");
      }
      
      return true; // Erfolgreich gespeichert
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      announce("Fehler: Änderungen konnten nicht am Server gespeichert werden.");
      return false;
    } finally {
      setSaving(false);
    }
  };

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

  const handleKeyDown = (e, card, fromList, targetList) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      moveCard(card, fromList, targetList);
    }
  };

  const moveCard = (card, fromList, toList) => {
    if (fromList === toList) return;
    if (fromList === "toEdit") {
      const hasAnswers = currentAnswers[card.id] && Object.keys(currentAnswers[card.id]).length > 0;

      if (hasAnswers) {
        setConfirmDialog({ open: true, card });
        return;
      }

      performMove(card);
    } else {
      // VERSCHIEBEN NACH "AUSGEWÄHLT"
      const updatedNotToEdit = notToEdit.filter((c) => c.id !== card.id);
      const updatedToEdit = [...toEdit, card];

      setNotToEdit(updatedNotToEdit);
      setToEdit(updatedToEdit);
      announce(`Paket "${card.name}" wurde nach "Ausgewählt" verschoben.`);
      
      // Direktes Speichern mit den neuen Arrays triggeren
      saveData(updatedToEdit, currentAnswers);
    }
  };

  const performMove = (card) => {
    // VERSCHIEBEN NACH "NICHT AUSGEWÄHLT"
    const updatedToEdit = toEdit.filter((c) => c.id !== card.id);
    const updatedNotToEdit = [...notToEdit, card];
    
    const updatedAnswers = { ...currentAnswers };
    delete updatedAnswers[card.id];

    setToEdit(updatedToEdit);
    setNotToEdit(updatedNotToEdit);
    setCurrentAnswers(updatedAnswers);
    
    announce(`Paket "${card.name}" wurde nach "Nicht ausgewählt" verschoben.`);

    // Direktes Speichern triggeren
    saveData(updatedToEdit, updatedAnswers);
  };

  const handleConfirm = () => {
    performMove(confirmDialog.card);
    setConfirmDialog({ open: false, card: null });
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

  // Klick auf "Fertig" leitet jetzt nur noch weiter, da alles bereits live gespeichert ist
  const handleFinish = () => {
    navigate("/dimensions");
  };

  const handleDragOverWindow = (e) => {
    const scrollZone = 350;
    const scrollSpeed = 50;
    const mouseY = e.clientY;
    const windowHeight = window.innerHeight;

    clearInterval(scrollIntervalRef.current);

    if (mouseY < scrollZone) {
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy(0, -scrollSpeed);
      }, 16);
    } else if (mouseY > windowHeight - scrollZone) {
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy(0, scrollSpeed);
      }, 16);
    }
  };

  const stopAutoScroll = () => {
    clearInterval(scrollIntervalRef.current);
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
      <p>
        Im Konfigurationsmodus wählen Sie aus, welche Pakete Sie bearbeiten möchten.
        <br /> Verschieben Sie diese einfach per Drag & Drop mit der Maus oder mit der Tastatur (Tab- und Enter-Taste).
        {saving && <strong style={{ marginLeft: "10px", color: "green" }}>– Speichert automatisch...</strong>}
      </p>

      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
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
          <h4 id="heading-toEdit" title="Alle Pakete, die zu Ihrer Abteilung passen">
            Ausgewählt
          </h4>

          <div className="editGrid" role="list" id="editGrid-toEdit" tabIndex={-1} aria-label="Liste der ausgewählten Pakete">
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
                    tabIndex={0}
                    aria-roledescription="Verschiebbares Element"
                    aria-label={`Paket ${dimension.name}. Drücken Sie Enter oder die Leertaste, um es nach 'Nicht ausgewählt' zu verschieben.`}
                    onDragStart={(e) => handleDragStart(e, dimension, "toEdit")}
                    onKeyDown={(e) => handleKeyDown(e, dimension, "toEdit", "notToEdit")}
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
                      isLocked={lockedCards.includes(dimension.id)? true : false}
                      showLock={showLock}
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
          <h4 id="heading-notToEdit" title="Alle Pakete, die nicht zu Ihrer Abteilung passen">
            Nicht ausgewählt
          </h4>

          <div className="editGrid" role="list" id="editGrid-notToEdit" tabIndex={-1} aria-label="Liste der nicht ausgewählten Pakete">
            {notToEdit.map((dimension) => (
              <div
                key={dimension.id}
                role="listitem"
                draggable
                tabIndex={0}
                aria-roledescription="Verschiebbares Element"
                aria-label={`Paket ${dimension.name}. Drücken Sie Enter oder die Leertaste, um es nach 'Ausgewählt' zu verschieben.`}
                onDragStart={(e) => handleDragStart(e, dimension, "notToEdit")}
                onKeyDown={(e) => handleKeyDown(e, dimension, "notToEdit", "toEdit")}
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
        {/* Button ruft nun handleFinish auf und ist deaktiviert, solange im Hintergrund gespeichert wird */}
        <button
          className="finishEditButton"
          onClick={handleFinish}
          disabled={saving}
        >
          Fertig
        </button>

        <Link to="/dimensions">
          <button className="finishEditButton">Abbrechen</button>
        </Link>
      </div>

      {/* --- CONFIRM DIALOG --- */}
      {confirmDialog.open && (
        <div className="modalOverlay" role="dialog" aria-labelledby="modal-title" aria-modal="true">
          <div className="modal">
            <p id="modal-title">
              Der Bearbeitungsstand von "{confirmDialog.card.name}" wird beim Verschieben dieses Pakets zurückgesetzt.
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
