const express = require("express");
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.authenticated) {
    return res.status(401).json({
      ok: false,
      message: "Nicht eingeloggt",
    });
  }

  if (!req.session.team) {
    return res.status(403).json({
      ok: false,
      message: "Kein Team ausgewählt",
    });
  }

  next();
}

router.post("/results", requireAuth, (req, res) => {
  if (!req.session.results) req.session.results = [];

  const payloadWithSessionMeta = {
    ...req.body,
    team: req.session.team,
    savedAt: new Date().toISOString(),
  };

  req.session.results.push(payloadWithSessionMeta);

  console.log("Session gespeichert:", req.session.results);

  res.json({
    ok: true,
    team: req.session.team,
  });
});

router.get("/results", requireAuth, (req, res) => {
  if (!req.session.results) req.session.results = [];

  res.json({
    sessionId: req.session.id,
    team: req.session.team,
    results: req.session.results,
  });
});

module.exports = router;