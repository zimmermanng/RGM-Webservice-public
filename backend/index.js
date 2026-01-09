const express = require("express");
const cors = require("cors");

const app = express();
const port = 3001;

// Middleware
app.use(cors()); 
app.use(express.json()); 

// Test
app.get("/", (req, res) => {
  res.send("Backend läuft 🚀");
});

// Endpoint für Questionnaire
app.post("/api/results", (req, res) => {
  console.log("Empfangene Daten:", req.body);
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Backend läuft auf http://localhost:${port}`);
});
