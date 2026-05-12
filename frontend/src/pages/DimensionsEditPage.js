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
            : filteredDimensions;

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
      announce(`"${card.name}" verschoben in Zu bearbeiten`);
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

    announce(`"${card.name}" verschoben in Nicht zu bearbeiten`);
  };

  const handleConfirm = () => {
    performMove(confirmDialog.card);
    setConfirmDialog({ open: false, card: null });
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
  };

  const handleSave = async () => {
    const activeDimensions = toEdit.map((d) => d.id);
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
      <div className="mainContainer">
        <p>Lade Konfiguration...</p>
      </div>
    );
  }

  return (
    <div className="mainContainer">
      <h2>Konfigurationsmodus</h2>

      <div
        ref={liveRegionRef}
        aria-live="polite"
        style={{ position: "absolute", left: "-9999px" }}
      />

      <div className="editModeWrapper">
        <div
          className="dropZone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "toEdit")}
        >
          <h4 title="Alle Pakete, die zu Ihrer Abteilung passen">Ausgewählt</h4>
          <div className="editGrid">
            {toEdit.length === 0 ? (
              <div className="emptyState">Bis jetzt wurden noch keine Pakete ausgewählt</div>
            ) : (
              toEdit.map((dimension) => {
                const progress = getProgress(dimension);
                return (
                  <div
                    key={dimension.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, dimension, "toEdit")}
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

        <div
          className="dropZone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "notToEdit")}
        >
          <h4 title="Alle Pakete, die nicht zu Ihrer Abteilung passen">
            Nicht ausgewählt
          </h4>

          <div className="editGrid">
            {notToEdit.map((dimension) => (
              <div
                key={dimension.id}
                draggable
                onDragStart={(e) => handleDragStart(e, dimension, "notToEdit")}
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
        >
          {saving ? "Speichern..." : "Fertig"}
        </button>

        <Link to="/dimensions">
          <button className="finishEditButton">Abbrechen</button>
        </Link>
      </div>

      {confirmDialog.open && (
        <div className="modalOverlay">
          <div className="modal">
            <p>
              Der Bearbeitungsstand von "{confirmDialog.card.name}" wird bei
              Verschieben dieses Pakets zurückgesetzt.
            </p>

            <div className="modalButtons">
              <button onClick={handleCancel}>Abbrechen</button>
              <button onClick={handleConfirm} className="danger">
                Trotzdem verschieben
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DimensionsEditPage;