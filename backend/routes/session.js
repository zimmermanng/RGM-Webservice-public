const express = require("express");
const router = express.Router();

// POST: Ergebnis speichern
router.post("/results", (req, res) => {
  if (!req.session.results) req.session.results = [];

  req.session.results.push({
    timestamp: new Date().toISOString(),
    data: req.body,
  });

  console.log("Session gespeichert:", req.session.results);

  res.json({ status: "ok" }); // ✅ JSON antworten!
});

// GET: Ergebnisse abrufen
router.get("/results", (req, res) => {
  if (!req.session.results) req.session.results = [];

  console.log("Session-ID:", req.session.id);
  console.log("Session-Daten:", req.session.results);

  res.json({
    sessionId: req.session.id,
    results: req.session.results,
  });
});

module.exports = router;

