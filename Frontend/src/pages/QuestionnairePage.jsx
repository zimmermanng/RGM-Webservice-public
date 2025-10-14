import React, { useState } from "react";
import "./QuestionnairePage.css";
import fragen from "../components/data/fragen.json"; // JSON importieren
import { useParams } from "react-router-dom";

export default function QuestionnairePage() {
  // State zum Speichern der ausgewählten Antworten
  const { dimensionId } = useParams();
  console.log("dimensionId:", dimensionId);

  const [selectedAnswers, setSelectedAnswers] = useState({});

  const filteredFragen = fragen.fragen.filter(
    (frage) => frage.antworten.dimensionId === dimensionId
  );

  // Klick auf eine Antwort
  const handleAnswerClick = (frage, antwort) => {
    console.log("Antwort:", antwort.antwort, "| Stufe:", antwort.stufe);

    // Antwort + Frage im State speichern
    setSelectedAnswers((prev) => ({
      ...prev,
      [frage.id]: {
        frageId: frage.id,
        frageText: frage.frage,
        antwortId: antwort.id,
        antwortText: antwort.antwort,
        stufe: antwort.stufe,
      },
    }));
  };

  // Alle Antworten anzeigen / weiterverarbeiten
  const handleSubmit = () => {
    console.log("Alle ausgewählten Antworten:", selectedAnswers);

    // Beispiel: nur die Paare Frage → Stufe extrahieren
    const result = Object.values(selectedAnswers).map((entry) => ({
      frage: entry.frageText,
      stufe: entry.stufe,
    }));

    console.log("Frage-Stufen-Paare:", result);
  };

  return (
    <div className="mainContainer" id="top">
      <div className="questions-container">
        <h2>Fragen & Antworten</h2>
    </div>
    <div className='mainContainer'>
        {filteredFragen.map((frage) => (
          <div key={frage.id} className="question-box">
            <p className="question-text">{frage.frage}</p>
            <div className="answers">
              {frage.antworten.map((antwort) => {
                const isSelected =
                  selectedAnswers[frage.id]?.antwortId === antwort.id; // prüfen, ob gewählt

                return (
                  <button
                    key={antwort.id}
                    className={`answer-button ${isSelected ? "selected" : ""}`}
                    onClick={() => handleAnswerClick(frage, antwort)}
                  >
                    {antwort.antwort}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button className="submit-button" onClick={handleSubmit}>
          Antworten speichern / auswerten
        </button>
      </div>
      </div>
  );
}
