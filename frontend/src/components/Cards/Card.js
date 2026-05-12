import React from "react";
import { Link } from "react-router-dom";

const createId = (value) =>
  String(value || "card")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const Card = ({
  icon,
  title,
  description,
  link,
  linkText,
  isDownload = false,
  list,
}) => {
  const safeTitleId = createId(title);
  const titleId = `card-title-${safeTitleId}`;
  const descId = `card-desc-${safeTitleId}`;
  const hasList = Array.isArray(list) && list.length > 0;

  return (
    <article className="card" aria-labelledby={titleId} aria-describedby={descId}>
      {icon && (
        <div className="card-icon" aria-hidden={typeof icon !== "string" ? undefined : "true"}>
          {typeof icon === "string" ? <img src={icon} alt="" /> : icon}
        </div>
      )}

      <div className="card-content">
        <h3 id={titleId}>{title}</h3>
        <p id={descId}>{description}</p>
        {hasList && (
          <ul>
            {list.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      {link && linkText && (
        <div className="card-link">
          {isDownload ? (
            <a href={link} download aria-describedby={descId}>
              {linkText}
            </a>
          ) : (
            <Link to={link} aria-describedby={descId}>
              {linkText}
            </Link>
          )}
        </div>
      )}
    </article>
  );
};

export default Card;
