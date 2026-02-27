const express = require("express");
const cors = require("cors");
const session = require("express-session");
const sessionRoutes = require("./routes/session");

const app = express();
const port = 3011;

// CORS
app.use(
  cors({
    origin: "http://localhost:3010",
    credentials: true,
  })
);

// Body Parser
app.use(express.json());

// Session
app.use(
  session({
    name: "questionnaire.sid",
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60,
    },
  })
);

// Session Routes
app.use("/api/session", sessionRoutes);

// Start Server
app.listen(port, () => {
  console.log(`Backend läuft auf http://localhost:${port}`);
});

