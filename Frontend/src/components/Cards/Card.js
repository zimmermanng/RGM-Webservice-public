import React from "react";
import { Link } from "react-router-dom";
import "./Card.css";

const Card = ({
  icon,
  title,
  description,
  link,
  linkText,
  isDownload = false,
  list,
}) => {
  return (
    <div
      className="card"
      tabIndex="0"
      role="article"
       aria-labelledby={`card-title-${title}`}
       aria-describedby={`card-desc-${title}`}
       onClick={() => {
        if (isDownload) {
          window.location.href = link;
        } else if (link) {
          window.location.href = link;
        }
      }} 
    >
      <div className="card-icon">
        <div className="card-icon">
          {typeof icon === "string" ? <img src={icon} alt={title} /> : icon}
        </div>
      </div>
      <div className="card-content">
        <h3>{title}</h3>
        <p>{description}</p>
        {Array.isArray(list) && list.length > 0 && (
          <ul>
            {list.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
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
