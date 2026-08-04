import React, { useEffect, useRef, useState, useMemo } from "react";
import data from "../components/data/struktur.json";
import Card_dimensions from "../components/Cards/Card_dimensions";
import { Link, useNavigate } from "react-router-dom";
import dimensionenContent from "../components/data/dimensionen_content.json";
import { API_BASE } from "../config.ts";
import useDialogFocus from "../hooks/useDialogFocus";

const DimensionsEditPage = ({ onSessionInvalid }) => {
  const navigate = useNavigate();
  const [toEdit, setToEdit] = useState([]);
  const [notToEdit, setNotToEdit] = useState([]);
  const [lockedCards, setLockedCards] = useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [privilegedAccess, setprivilegedAccess] = useState(false);
  const toastTimeoutRef = useRef(null);
  const scrollIntervalRef = useRef(null);
  const liveRegionRef = useRef(null);
  const [evaluationName, setEvaluationName] = useState("");
  const [pendingPackageFocus, setPendingPackageFocus] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    card: null,
  });
  const confirmCancelRef = useRef(null);

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

    let totalQuestions = 0;
    let answeredCount = 0;

    if (Array.isArray(dimension.handlungsfelder)) {
      dimension.handlungsfelder.forEach((hf) => {
        if (Array.isArray(hf.fragen)) {
          totalQuestions += hf.fragen.length;

          hf.fragen.forEach((frage) => {
            if (
              answeredObj[frage.id] !== undefined &&
              answeredObj[frage.id] !== null &&
              answeredObj[frage.id] !== ""
            ) {
              answeredCount++;
            }
          });
        }
      });
    }

    return totalQuestions > 0 ? Math.min(answeredCount / totalQuestions, 1) : 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, stateRes, evaluationRes] = await Promise.all([
          fetch(`${API_BASE}/session/settings`, {
            credentials: "include"
          }),
          fetch(`${API_BASE}/session/current-state`, {
            credentials: "include",
          }),
          fetch(`${API_BASE}/evaluation/`, {
            credentials: "include"
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

        if (!settingsRes.ok || !stateRes.ok) throw new Error("Ladefehler");

        const settingsResult = await settingsRes.json();
        const stateResult = await stateRes.json();
        const evaluationResult = await evaluationRes.json();

        const activeIds = Array.isArray(settingsResult.activeDimensions)
          ? settingsResult.activeDimensions
          : [];

        const lockedIds = Array.isArray(settingsResult.lockedDimensions)
          ? settingsResult.lockedDimensions
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

        const activeEvaluation = evaluationResult.evaluationRounds.find(obj => obj.isActive);
        setEvaluationName(activeEvaluation.name)

        setToEdit(initialToEdit);
        setNotToEdit(initialNotToEdit);
        setCurrentAnswers(loadedAnswers);
        setLockedCards(lockedIds);
        setprivilegedAccess(settingsResult.privilegedAccess);
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

  const saveData = async (nextToEdit, nextAnswers) => {
    const allgemeinDimension = data.dimensionen.find(
      (d) => d.name === "Allgemein",
    );
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
        await onSessionInvalid?.(
          "Ihre Sitzung ist nicht mehr gültig. Bitte melden Sie sich erneut an.",
        );
        return false;
      }
      if (settingsRes.status === 403 || stateRes.status === 403) {
        await onSessionInvalid?.(
          "Ihre Teamzuordnung ist nicht mehr gültig. Bitte melden Sie sich erneut an und wählen Sie eine Organisationseinheit aus.",
        );
        return false;
      }

      if (!settingsRes.ok || !stateRes.ok) {
        throw new Error("Fehler beim automatischen Speichern");
      }

      return true;
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      announce(
        "Fehler: Änderungen konnten nicht am Server gespeichert werden.",
        "error",
      );
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

  const handleClick = (e) => {
    if (e.target.closest("button") || e.target.closest("a")) return;
    e.currentTarget.focus({ focusVisible: true });
  };

  const handleKeyDown = (e, card, fromList, targetList) => {
    if (e.target !== e.currentTarget) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (lockedCards.includes(card.id) && fromList === "toEdit") {
        announce(`Paket "${card.name}" ist gesperrt und kann nicht verschoben werden.`);
        return;
      }
      moveCard(card, fromList, targetList);
    }
  };

  const moveCard = (card, fromList, toList) => {
    if (fromList === toList) return;
    if (fromList === "toEdit") {
      const hasAnswers = getProgress(card) > 0;

      if (hasAnswers) {
        setConfirmDialog({ open: true, card });
        return;
      }

      performMove(card);
    } else {
      const updatedNotToEdit = notToEdit.filter((c) => c.id !== card.id);
      const updatedToEdit = [...toEdit, card];

      setNotToEdit(updatedNotToEdit);
      setToEdit(updatedToEdit);
      setPendingPackageFocus({ id: card.id, list: "toEdit" });
      announce(`Paket "${card.name}" wurde nach "Ausgewählt" verschoben.`);
      saveData(updatedToEdit, currentAnswers);
    }
  };

  const performMove = (card) => {
    const updatedToEdit = toEdit.filter((c) => c.id !== card.id);
    const updatedNotToEdit = [...notToEdit, card];

    const updatedAnswers = { ...currentAnswers };
    delete updatedAnswers[card.id];

    setToEdit(updatedToEdit);
    setNotToEdit(updatedNotToEdit);
    setCurrentAnswers(updatedAnswers);
    setPendingPackageFocus({ id: card.id, list: "notToEdit" });

    announce(`Paket "${card.name}" wurde nach "Nicht ausgewählt" verschoben.`);
    saveData(updatedToEdit, updatedAnswers);
  };

  const handleConfirm = () => {
    performMove(confirmDialog.card);
    setConfirmDialog({ open: false, card: null });
  };

  const handleCancel = () => {
    setConfirmDialog({ open: false, card: null });
  };

  const confirmDialogRef = useDialogFocus(confirmDialog.open, {
    initialFocusRef: confirmCancelRef,
    onClose: handleCancel,
  });

  useEffect(() => {
    if (!pendingPackageFocus) return undefined;

    const timeoutId = window.setTimeout(() => {
      document
        .getElementById(
          `config-package-${pendingPackageFocus.list}-${pendingPackageFocus.id}`,
        )
        ?.focus();
      setPendingPackageFocus(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pendingPackageFocus, toEdit, notToEdit]);

  const announce = (message, type = "status") => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute(
        "role",
        type === "error" ? "alert" : "status",
      );
      liveRegionRef.current.setAttribute(
        "aria-live",
        type === "error" ? "assertive" : "polite",
      );
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
      <h1>Konfigurationsmodus</h1>
      {evaluationName && (
        <h2>Evaluationsrunde „{evaluationName}“</h2>
      )}
      <p>
        Im Konfigurationsmodus wählen Sie aus, welche Pakete Sie bearbeiten
        möchten.
        <br /> Verschieben Sie ein Paket, indem Sie es <strong>anklicken und die Auswahl mit Enter bestätigen</strong>. <br /> Alternativ können Sie die Pakete mit der Maus ziehen oder die Tastaturbedienung (Tab- und Enter-Taste) verwenden.
        {saving && (
          <strong style={{ marginLeft: "10px", color: "green" }}>
            – Speichert automatisch...
          </strong>
        )}
      </p>

      <div
        ref={liveRegionRef}
        role="status"
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
          <h3
            id="heading-toEdit"
            title="Alle Pakete, die zu Ihrer Abteilung passen"
          >
            Ausgewählt
          </h3>

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
                const isLocked = lockedCards.includes(dimension.id);
                return (
                  <div
                    key={dimension.id}
                    id={`config-package-toEdit-${dimension.id}`}
                    role="listitem"
                    draggable={!isLocked}
                    tabIndex={0}
                    aria-roledescription={isLocked ? undefined : "Verschiebbares Paket"}
                    aria-label={
                      isLocked
                        ? `Paket ${dimension.name}. Ausgewählt und gesperrt. Das Paket kann nicht verschoben werden.`
                        : `Paket ${dimension.name}. Ausgewählt. Klicken Sie, um es zu markieren, und drücken Sie Enter, um es nach Nicht ausgewählt zu verschieben.`
                    }
                    onDragStart={(e) => handleDragStart(e, dimension, "toEdit")}
                    onKeyDown={(e) => handleKeyDown(e, dimension, "toEdit", "notToEdit")}
                    onClick={handleClick}
                    style={{ cursor: isLocked ? "default" : "pointer" }}
                  >
                    <Card_dimensions
                      title={dimension.name}
                      description={descriptionByDimensionId[dimension.id] || ""}
                      dimensionId={dimension.id}
                      handlungsfelder={dimension.handlungsfelder}
                      showStartButton={false}
                      showProgress={true}
                      headingLevel={4}
                      progress={progress}
                      privilegedAccess={privilegedAccess}
                      isLocked={isLocked}
                      showLock={
                        privilegedAccess || isLocked
                      }
                      setLockedCards={setLockedCards}
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
          <h3
            id="heading-notToEdit"
            title="Alle Pakete, die nicht zu Ihrer Abteilung passen"
          >
            Nicht ausgewählt
          </h3>

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
                id={`config-package-notToEdit-${dimension.id}`}
                role="listitem"
                draggable
                tabIndex={0}
                aria-roledescription="Verschiebbares Paket"
                aria-label={`Paket ${dimension.name}. Nicht ausgewählt. Klicken Sie, um es zu markieren, und drücken Sie Enter, um es nach Ausgewählt zu verschieben.`}
                onDragStart={(e) => handleDragStart(e, dimension, "notToEdit")}
                onKeyDown={(e) => handleKeyDown(e, dimension, "notToEdit", "toEdit")}
                onClick={handleClick}
                style={{ cursor: "pointer" }}
              >
                <Card_dimensions
                  title={dimension.name}
                  description={descriptionByDimensionId[dimension.id] || ""}
                  dimensionId={dimension.id}
                  handlungsfelder={dimension.handlungsfelder}
                  showStartButton={false}
                  showProgress={false}
                  headingLevel={4}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="footer">
        <button
          className="finishEditButton"
          onClick={handleFinish}
          disabled={saving}
        >
          Fertig
        </button>

        <Link to="/dimensions" className="finishEditButton button">
          Abbrechen
        </Link>
      </div>

      {/* --- CONFIRM DIALOG --- */}
      {confirmDialog.open && (
        <div className="modalOverlay" role="presentation">
          <div ref={confirmDialogRef} className="modal" role="alertdialog" aria-labelledby="reset-package-title" aria-modal="true" tabIndex={-1}>
            <p id="reset-package-title">
              Der Bearbeitungsstand von "{confirmDialog.card.name}" wird beim
              Verschieben dieses Pakets zurückgesetzt.
            </p>

            <div className="modalButtons">
              <button ref={confirmCancelRef} onClick={handleCancel}>
                Paket nicht verschieben
              </button>
              <button onClick={handleConfirm} className="danger">
                Trotzdem verschieben
              </button>
            </div>
          </div>
        </div>
      )}
      {toastMessage && (
        <div className="toast" aria-hidden="true" role="presentation">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default DimensionsEditPage;
