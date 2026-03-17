const express = require("express");
const router = express.Router();

const APP_PASSWORD = process.env.APP_PASSWORD || "change-me";

// Login
router.post("/login", (req, res) => {
  const { password } = req.body;

  if (!password || password !== APP_PASSWORD) {
    return res.status(401).json({
      ok: false,
      message: "Falsches Passwort",
    });
  }

  req.session.authenticated = true;
  req.session.team = null;

  return res.json({
    ok: true,
    authenticated: true,
    team: req.session.team,
  });
});

// Current auth state
router.get("/me", (req, res) => {
  return res.json({
    authenticated: !!req.session.authenticated,
    team: req.session.team || null,
  });
});

// Save selected team
router.post("/team", (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({
      ok: false,
      message: "Nicht eingeloggt",
    });
  }

  const { team } = req.body;

  if (!team) {
    return res.status(400).json({
      ok: false,
      message: "Kein Team ausgewählt",
    });
  }

  req.session.team = team;

  return res.json({
    ok: true,
    authenticated: true,
    team: req.session.team,
  });
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        message: "Logout fehlgeschlagen",
      });
    }

    res.clearCookie("questionnaire.sid");

    return res.json({
      ok: true,
    });
  });
});

module.exports = router;