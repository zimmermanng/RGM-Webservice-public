const express = require("express");
const router = express.Router();

let savedResults = [];

router.post("/results", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      ok: false,
      message: "Keine Ergebnisdaten erhalten",
    });
  }

  const payload = {
    ...req.body,
    savedAt: new Date().toISOString(),
  };

  savedResults.push(payload);

  console.log("Ergebnisse gespeichert:", savedResults.length);

  return res.json({
    ok: true,
    savedAt: payload.savedAt,
    resultCount: savedResults.length,
  });
});

router.get("/results", (req, res) => {
  return res.json({
    ok: true,
    results: savedResults,
  });
});

router.delete("/results", (req, res) => {
  savedResults = [];

  return res.json({
    ok: true,
    resultCount: savedResults.length,
  });
});

module.exports = router;
