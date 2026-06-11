import React, { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../../config.ts";

const Card_dimensions = ({
  title,
  description = "",
  dimensionId,
  handlungsfelder = [],
  link,
  showStartButton = true,
  showProgress = true,
  progress = 0,
  isLocked: initialIsLocked = false,
  showLock = false,
}) => {
  const [isLocked, setIsLocked] = useState(initialIsLocked);
  const titleId = `card-title-${dimensionId}`;
  const progressId = `card-progress-${dimensionId}`;
  const firstHF = handlungsfelder[0];

  const handleToggle = (e) => {
    e.stopPropagation(); // Verhindert, dass Drag-Events der übergeordneten Liste feuern
    setIsLocked((prev) => !prev);
    console.log("Lock Status:", !isLocked)
    console.log("Selected Card:", dimensionId)
    try {
      fetch(`${API_BASE}/session/locking-dimension`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimensionId: dimensionId,
          lockStatus: !isLocked,
        }),
      });
    } catch (error) {
      console.error("Fehler beim Speichern des Status:", error)
    }
  };
  const renderStatusIcon = () => {
    const iconSrc = isLocked ? "/lock-closed.svg" : "/lock_open.svg";
    const iconAlt = isLocked ? "Paket fixiert." : "Paket nicht fixiert.";
    return (
      <button
        type="button"
        className="icon-lock"
        onClick={handleToggle}
        aria-label={iconAlt}
        title={isLocked ? "Freischalten" : "Sperren"}
      >
        <img src={iconSrc} alt="" className="card-lock-icon" />
      </button>
    );
  };

  // Edit-Modus: link vorhanden
  if (link) {
    return (
      <div className="card_dimension" role="article">
        <div className="card-content">
          <h2 id={titleId}>{title}</h2>
          <Link to={link} className="hf-button">
            Fragebogen öffnen
          </Link>
        </div>
      </div>
    );
  }

  // Wenn keine Handlungsfelder vorhanden
  if (!handlungsfelder.length) return null;

  return (
    <div className="card" role="article" aria-labelledby={titleId}>
      <div className="card-content">
        <h3 id={titleId}>{title}</h3>

        {description && (
          <div className="background_declaration">
            <p>{description}</p>
          </div>
        )}

        <div className="dFooter">
          {showProgress && (
            <>
              <progress
                value={progress}
                max={1}
                aria-describedby={progressId}
              />
              <div id={progressId} className="progress-text">
                Fortschritt: {Math.round(progress * 100)}%
              </div>
              {showLock && (
                <div>
                  {renderStatusIcon()}
                </div>
              )}
            </>
          )}

          {showStartButton && firstHF && (
            <div className="dFooterButtons">
              <Link
                to={`/questionnaire/${dimensionId}/${firstHF.id}`}
                className="startButton"
              >
                Start
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card_dimensions;
