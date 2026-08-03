require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const sessionRoutes = require("./routes/session");
const authRoutes = require("./routes/auth");
const databaseRoutes = require("./routes/database");
const evaluationRoutes = require("./routes/evaluation");

const app = express();
const port = 3011;

const SESSION_TIMEOUT_MS =
  Number(process.env.SESSION_TIMEOUT_MS) || 1000 * 60 * 60 * 24 * 365 * 10;

app.set("trust proxy", 1);
//"http://localhost:3011"
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

app.use(express.json());

app.use(
  session({
    name: "questionnaire.sid",
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    rolling: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TIMEOUT_MS,
    },
  })
);

app.use("/auth", authRoutes);
app.use("/session", sessionRoutes);
app.use("/database", databaseRoutes);
app.use("/evaluation", evaluationRoutes)

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend läuft auf Port ${port}`);
});
