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

  return (
    <div
      className="card"
      tabIndex="0"
      role="article"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={() => {
        if (link) {
          window.location.href = link;
        }
      }}
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


