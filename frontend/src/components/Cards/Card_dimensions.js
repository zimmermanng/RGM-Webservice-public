import React from "react";
import { Link } from "react-router-dom";

const Card_dimensions = ({
  title,
  description = "",
  dimensionId,
  handlungsfelder = [],
  link,
  showStartButton = true,
  showProgress = true,
  progress = 0,
}) => {
  const titleId = `card-title-${dimensionId}`;
  const progressId = `card-progress-${dimensionId}`;
  const firstHF = handlungsfelder[0];

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