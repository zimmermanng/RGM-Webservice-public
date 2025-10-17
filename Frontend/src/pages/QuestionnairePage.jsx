import React, { useState, useMemo } from "react";
import "./QuestionnairePage.css";
import fragen from "../components/data/fragen.json"; 
import struktur from "../components/data/struktur.json"; 
import { useParams } from "react-router-dom";

export default function QuestionnairePage() {
  const { dimensionId } = useParams();
  console.log("dimensionId:", dimensionId);

  const [selectedAnswers, setSelectedAnswers] = useState({});

 
  const frageIdsForDimension = useMemo(() => {
    const dimension = struktur.dimensionen.find((d) => d.id === dimensionId);
    if (!dimension) return [];

    return dimension.handlungsfelder.flatMap((hf) =>
      hf.fragen.map((f) => f.id)
    );
  }, [dimensionId]);


  const filteredFragen = useMemo(() => {
    return fragen.fragen.filter((f) => frageIdsForDimension.includes(f.id));
  }, [frageIdsForDimension]);


  const handleAnswerClick = (frage, antwort) => {
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

  
  const handleSubmit = () => {
    const result = Object.values(selectedAnswers).map((entry) => ({
      frage: entry.frageText,
      stufe: entry.stufe,
    }));
    console.log("Auswertung:", result);
  };


  return (
    <div className="mainContainer" id="top">
      <div className="questions-container">
        <h2>Fragen & Antworten</h2>

        {filteredFragen.length === 0 ? (
          <p>Keine Fragen für diese Dimension gefunden.</p>
        ) : (
          filteredFragen.map((frage) => (
            <div key={frage.id} className="question-box">
              <p className="question-text">{frage.frage}</p>
              <div className="answers">
                {frage.antworten.map((antwort) => {
                  const isSelected =
                    selectedAnswers[frage.id]?.antwortId === antwort.id;
                  return (
                    <button
                      key={antwort.id}
                      className={`answer-button ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => handleAnswerClick(frage, antwort)}
                    >
                      {antwort.antwort}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}

        <button className="submit-button" onClick={handleSubmit}>
          Antworten speichern / auswerten
        </button>
      </div>
    </div>
  );
}