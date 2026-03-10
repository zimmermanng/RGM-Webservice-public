import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Card_dimensions.css";

const Card = ({ title, dimensionId, handlungsfelder = [], link, list }) => {
  const titleId = `card-title-${dimensionId}`;
  const [currentIndex, setCurrentIndex] = useState(0);
  const currDate = new Date().toLocaleDateString();
  const currTime = new Date().toLocaleTimeString();

  // 🔹 Edit-Modus: link vorhanden
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
  // 🔹 Carousel-Modus
  if (!handlungsfelder.length) return null;

  const prev = () => {
    setCurrentIndex((index) =>
      index === 0 ? handlungsfelder.length - 1 : index - 1
    );
  };

  const next = () => {
    setCurrentIndex((index) =>
      index === handlungsfelder.length - 1 ? 0 : index + 1
    );
  };

  const currentHF = handlungsfelder[currentIndex];

  return (
    <div className="card" role="article" aria-labelledby={titleId}>
      <div className="card-content">
        <h3 id={titleId}>{title}</h3>

        {/* Carousel */}
        <div className="carousel">
          <button
            className="carousel-arrow"
            onClick={prev}
            aria-label="Zurück"
          >
          </button>

          {currentHF && (
            <Link 
              to={`/questionnaire/${dimensionId}/${currentHF.id}`}
              className="hf-button"
            >
              {currentHF.name}
            </Link>
          )}

          <button
            className="carousel-arrow"
            onClick={next}
            aria-label="Weiter"
          >
          </button>
        </div>

        <p className="check">
        </p>
        <div class="change">Zuletzt aktualisiert am {currDate} um {currTime} </div>
        <hr>
        </hr>
        <div class="dFooter">
        <progress value={0.3} />
        <button>Ergebnisse</button>
        </div>
      </div>
   
    </div>
  );
};

export default Card;