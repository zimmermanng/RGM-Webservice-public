const express = require("express");
const cors = require("cors");
const session = require("express-session");
const sessionRoutes = require("./routes/session");

const app = express();
const port = process.env.PORT || 3011;

// CORS
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3010";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Body Parser
app.use(express.json());

// Session
app.use(
  session({
    name: "questionnaire.sid",
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60,
    },
  })
);

// Session Routes
app.use("/api/session", sessionRoutes);

// Start Server
app.listen(port, "0.0.0.0", () => {
  console.log(`Backend läuft auf Port ${port}`);
});