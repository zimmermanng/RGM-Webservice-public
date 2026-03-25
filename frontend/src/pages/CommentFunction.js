import React from "react";

export default function CommentBox({
  inputs,
  comments,
  onInputChange,
  onPost,
}) {
  return (
    <div className="comment-box">
      <label htmlFor="comment-user">
        Nutzer
        <input
          id="comment-user"
          value={inputs?.user || ""}
          onChange={(e) => onInputChange("user", e.target.value)}
          placeholder="Name eingeben"
          autoComplete="name"
        />
      </label>

      <label htmlFor="comment-text">
        Kommentar
        <textarea
          id="comment-text"
          value={inputs?.text || ""}
          onChange={(e) => onInputChange("text", e.target.value)}
          placeholder="Kommentar eingeben"
          rows={4}
        />
      </label>

      <button type="button" onClick={() => onPost()}>
        Senden
      </button>

      {(comments || []).length > 0 && (
        <div aria-label="Kommentare">
          {(comments || []).map((c, i) => (
            <p key={i}>
              <strong>{c.user}:</strong> {c.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}