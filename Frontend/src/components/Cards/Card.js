import React from "react";
import { Link } from "react-router-dom";
import "./Card.css";

const Card = ({ icon, title, description, link, linkText, isDownload = false }) => {
  return (
    <div className="card" tabIndex="0" role="article" aria-labelledby={`card-title-${title}`} aria-describedby={`card-desc-${title}`}>
      <div className="card-icon">
        <div className="card-icon">
          {typeof icon === "string" ? (<img src={icon} alt={title} />) : (icon)}
        </div>
      </div>
      <div className="card-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="card-link">
      {isDownload ? (
                    <a href={link} download>
                        {linkText}
                    </a>
                ) : (
                    <Link to={link}>{linkText}</Link>
                )}
      </div>
    </div>
  );
};

export default Card;
