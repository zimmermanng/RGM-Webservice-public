/**
 * Starts the Shuffle backend HTTP server.
 * The Express app is kept in `app.js` so it can be reused by tests or other
 * startup scripts without automatically opening a port.
 */
const app = require("./app");

const port = process.env.PORT || 3011;

app.listen(port, "0.0.0.0", () => {
  console.log(`Shuffle backend läuft auf Port ${port}`);
});