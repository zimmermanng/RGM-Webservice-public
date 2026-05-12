const app = require("./app");

const port = process.env.PORT || 3011;

app.listen(port, "0.0.0.0", () => {
  console.log(`Shuffle backend läuft auf Port ${port}`);
});
