require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sessionRoutes = require("./routes/session");

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: allowedOrigin,
  })
);

app.use(express.json({ limit: "5mb" }));

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Shuffle backend is running" });
});

app.use("/session", sessionRoutes);

module.exports = app;
