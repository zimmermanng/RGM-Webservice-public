import React from "react";
import "./DimensionsPage.css";
import data from "../components/data/struktur.json";
import Card from "../components/Cards/Card";

const DimensionsPage = () => {
  return (
    <>
      <div className="mainContainer" id="top">
        <h3>Pakete</h3>
        <p>
          Hier ist eine Anleitung, wie die Pakete am Besten benutzt werden
          können
        </p>
      </div>
      <div className="cardBox">
        {data.dimensionen.map((dimension) => (
          <Card
            key={dimension.id}
            title={dimension.name}
            list={dimension.handlungsfelder.map(
              (handlungsfeld) => handlungsfeld.name
            )}
            link={`/questionnaire/${dimension.id}`}
          />
        ))}
      </div>
    </>
  );
};

export default DimensionsPage;
