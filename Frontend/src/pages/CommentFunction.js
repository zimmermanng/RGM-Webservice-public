import React from "react";
import "./CommentFunction.css";

export default function CommentBox({
  frageId,
  inputs,
  comments,
  onInputChange,
  onPost,
}) {
  return (
    <div className="comment-box">
  <label>
    Nutzer
    <input
      value={inputs?.user || ""}
      onChange={(e) => onInputChange(frageId, "user", e.target.value)}
      placeholder="Name eingeben"
    />
  </label>

  <label>
    Kommentar
    <input
      value={inputs?.text || ""}
      onChange={(e) => onInputChange(frageId, "text", e.target.value)}
      placeholder="Kommentar eingeben"
    />
  </label>

  <button onClick={() => onPost(frageId)}>Senden</button>

  {(comments || []).map((c, i) => (
    <p key={i}>
      <strong>{c.user}:</strong> {c.text}
    </p>
  ))}
</div>

  );
}
