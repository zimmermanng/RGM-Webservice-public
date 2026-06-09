const express = require("express");
const router = express.Router();

/**
 * The questionnaire results are intentionally not stored on the backend.
 * Results live only in the user's browser localStorage so multiple users can
 * use the same deployed backend without seeing or overwriting each other's data.
 */
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
