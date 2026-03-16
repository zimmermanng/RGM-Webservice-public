import React from "react";

export default function CommentBox({
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
      onChange={(e) => onInputChange("user", e.target.value)}
      placeholder="Name eingeben"
    />
  </label>

  <label>
    Kommentar
    <input
      value={inputs?.text || ""}
      onChange={(e) => onInputChange("text", e.target.value)}
      placeholder="Kommentar eingeben"
    />
  </label>

  <button onClick={() => onPost()}>Senden</button>

  {(comments || []).map((c, i) => (
    <p key={i}>
      <strong>{c.user}:</strong> {c.text}
    </p>
  ))}
</div>

  );
}
