import React from "react";
import { Link } from "react-router-dom";

const Card_dimensions = ({
  title,
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
  const progressPercent = Math.round(progress * 100);

  if (link) {
    return (
      <article className="card_dimension" aria-labelledby={titleId}>
        <div className="card-content">
          <h2 id={titleId}>{title}</h2>
          <Link to={link} className="hf-button">
            Fragebogen öffnen
          </Link>
        </div>
      </article>
    );
  }

  if (!handlungsfelder.length) return null;

  return (
    <article className="card dimensionCard" aria-labelledby={titleId}>
      <div className="card-content dimensionCardContent">
        <h2 id={titleId}>{title}</h2>

        <div className="background_declaration">
          <p>
            Dieses Päckchen wird importiert, wenn in dem Referat
            Ergebnisprodukte jeglicher Art (Software, Materialien, Content,...)
            entstehen, die barrierefrei sein sollen.
          </p>
        </div>

        <div className="dFooter">
          {showProgress && (
            <div className="dimensionProgress" aria-labelledby={progressId}>
              <progress
                value={progress}
                max={1}
                aria-label={`Fortschritt ${title}: ${progressPercent}%`}
              />
              <div className="progress-text" id={progressId}>
                Fortschritt: {progressPercent}%
              </div>
            </div>
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
    </article>
  );
};

export default Card_dimensions;
