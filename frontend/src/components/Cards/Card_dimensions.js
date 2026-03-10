import React from "react";
import { Link } from "react-router-dom";
import "./Card.css";

const Card = ({
  title,
  dimensionId,
  handlungsfelder = [],
}) => {
  const titleId = `card-title-${dimensionId}`;

  return (
    <div className="card" role="article" aria-labelledby={titleId}>
      <div className="card-content">
        <h3 id={titleId}>{title}</h3>

        <ul>
          {handlungsfelder.map((hf) => (
            <li key={hf.id}>
              <Link to={`/questionnaire/${dimensionId}/${hf.id}`}>
                {hf.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Card;