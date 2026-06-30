/**
 * Browser entry point for the Shuffle React frontend.
 * It mounts the root App component into the DOM element provided by public/index.html.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);