import React, { useEffect, useState } from "react";
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
  headingLevel = 3,
  progress = 0,
  privilegedAccess,
  isLocked: initialIsLocked = false,
  showLock = false,
  setLockedCards
}) => {
  const [isLocked, setIsLocked] = useState(initialIsLocked);
  const [isSavingLock, setIsSavingLock] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const titleId = `card-title-${dimensionId}`;
  const progressId = `card-progress-${dimensionId}`;
  const lockStatusId = `card-lock-status-${dimensionId}`;
  const firstHF = handlungsfelder[0];
  const CardHeading = headingLevel === 4 ? "h4" : "h3";

  useEffect(() => {
    setIsLocked(initialIsLocked);
  }, [initialIsLocked]);

  const handleToggle = async (e) => {
    if (!privilegedAccess || isSavingLock) return;
    e.stopPropagation();
    const nextIsLocked = !isLocked;
    setIsLocked(nextIsLocked);
    setIsSavingLock(true);
    setLockMessage(`Status für Paket ${title} wird gespeichert.`);
    try {
      const lockRes = await fetch(`${API_BASE}/session/locking-dimension`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimensionId: dimensionId,
          lockStatus: nextIsLocked,
        }),
      });
      if (!lockRes.ok) {
        throw new Error("Sperrstatus konnte nicht gespeichert werden.");
      }
      const results = await lockRes.json();
      const lockedDimensions = results.lockedDimensions ? results.lockedDimensions : [];
      setLockedCards?.(lockedDimensions);
      const savedIsLocked = lockedDimensions.includes(dimensionId);
      setIsLocked(savedIsLocked);
      setLockMessage(
        `Paket ${title} ist jetzt ${
          savedIsLocked ? "gesperrt" : "nicht gesperrt"
        }.`,
      );
      return results;
    } catch (error) {
      console.error("Fehler beim Speichern des Status:", error);
      setIsLocked(!nextIsLocked);
      setLockMessage(
        `Fehler: Der Sperrstatus für Paket ${title} konnte nicht gespeichert werden.`,
      );
    } finally {
      setIsSavingLock(false);
    }
  };
  const renderStatusIcon = () => {
    const iconSrc = isLocked ? "/lock-closed.svg" : "/lock_open.svg";
    const statusText = isLocked ? "gesperrt" : "nicht gesperrt";

    if (!privilegedAccess) {
      return (
        <span
          className="icon-lock"
          role="img"
          aria-label={`Paket ${title} ist ${statusText}`}
          title={`Paket ist ${statusText}`}
        >
          <img src={iconSrc} alt="" className="card-lock-icon" />
        </span>
      );
    }

    return (
      <button
        type="button"
        className="icon-lock"
        onClick={handleToggle}
        aria-label={`Paket ${title} ${isLocked ? "freischalten" : "sperren"}`}
        aria-pressed={isLocked}
        aria-busy={isSavingLock}
        aria-describedby={lockStatusId}
        disabled={isSavingLock}
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
        <CardHeading id={titleId}>{title}</CardHeading>

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
                aria-labelledby={`${titleId} ${progressId}`}
              />
              <div id={progressId} className="progress-text">
                Fortschritt: {Math.round(progress * 100)}%
              </div>
              {showLock && (
                <div>
                  {renderStatusIcon()}
                  <span
                    id={lockStatusId}
                    className="sr-only"
                    role={lockMessage.startsWith("Fehler:") ? "alert" : "status"}
                    aria-live={
                      lockMessage.startsWith("Fehler:") ? "assertive" : "polite"
                    }
                    aria-atomic="true"
                  >
                    {lockMessage ||
                      `Paket ${title} ist ${
                        isLocked ? "gesperrt" : "nicht gesperrt"
                      }.`}
                  </span>
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
