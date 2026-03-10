const express = require("express");
const cors = require("cors");
const session = require("express-session");
const sessionRoutes = require("./routes/session");

const app = express();
const port = 3011;

app.set("trust proxy", 1);

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";
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
proxy: true,
cookie: {
httpOnly: true,
secure: process.env.NODE_ENV === "production",
sameSite: "lax",
maxAge: 1000 * 60 * 60,
},
})
);

app.use("/session", sessionRoutes);

app.listen(port, "0.0.0.0", () => {
console.log (`Backend läuft auf Port ${port}`);
});