/**
 * Session result endpoints for the Shuffle backend.
 * The frontend keeps questionnaire results in browser storage, so these routes
 * intentionally acknowledge requests without persisting or returning shared data.
 */
const express = require("express");
const router = express.Router();

router.post("/results", (req, res) => {
  return res.status(204).send();
});

router.get("/results", (req, res) => {
  return res.json({
    ok: true,
    results: [],
  });
});

router.delete("/results", (req, res) => {
  return res.json({
    ok: true,
    results: [],
  });
});

module.exports = router;