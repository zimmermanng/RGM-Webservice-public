/**
 * Reusable content card for links, downloads, and short descriptive lists.
 * The card can render either an internal React Router link or a downloadable
 * file link while keeping accessible title and description relationships.
 */
import React from "react";
import { Link } from "react-router-dom";

// Builds stable DOM ids from visible card titles for aria attributes.
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
  const linkAriaLabel = title ? `${linkText}: ${title}` : linkText;

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
            <a href={link} download aria-label={linkAriaLabel} aria-describedby={descId}>
              {linkText}
            </a>
          ) : (
            <Link to={link} aria-label={linkAriaLabel} aria-describedby={descId}>
              {linkText}
            </Link>
          )}
        </div>
      )}
    </article>
  );
};

export default Card;
