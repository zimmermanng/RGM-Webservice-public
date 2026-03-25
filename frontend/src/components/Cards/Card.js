import React from "react";
import { Link } from "react-router-dom";

const Card = ({
  icon,
  title,
  description,
  link,
  linkText,
  isDownload = false,
  list,
}) => {
  const titleId = `card-title-${title}`;
  const descId = `card-desc-${title}`;

  if (isDownload) {
    return (
      <div
        className="card"
        role="article"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className="card-icon">
          {typeof icon === "string" ? <img src={icon} alt={title} /> : icon}
        </div>

        <div className="card-content">
          <h3 id={titleId}>{title}</h3>
          <p id={descId}>{description}</p>
          {Array.isArray(list) && list.length > 0 && (
            <ul>
              {list.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-link">
          <a href={link} download>
            {linkText}
          </a>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={link}
      className="card"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <div className="card-icon">
        {typeof icon === "string" ? <img src={icon} alt={title} /> : icon}
      </div>

      <div className="card-content">
        <h3 id={titleId}>{title}</h3>
        <p id={descId}>{description}</p>
        {Array.isArray(list) && list.length > 0 && (
          <ul>
            {list.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-link" aria-hidden="true">
        <span>{linkText}</span>
      </div>
    </Link>
  );
};

export default Card;