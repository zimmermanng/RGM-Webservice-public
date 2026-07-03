require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const sessionRoutes = require("./routes/session");
const authRoutes = require("./routes/auth");
const databaseRoutes = require("./routes/database");

const app = express();
const port = 3011;

const SESSION_TIMEOUT_MS =
  Number(process.env.SESSION_TIMEOUT_MS) || 1000 * 60 * 60 * 24 * 365 * 10;

app.set("trust proxy", 1);
//"http://localhost:3011"
const allowedOrigin = process.env.FRONTEND_URL;
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

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

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend läuft auf Port ${port}`);
});