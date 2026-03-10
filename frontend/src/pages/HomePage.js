import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

function HomePage() {

  return (
    <div className="mainContainer" id="top">
      <h1>(WIP)</h1>
      <h1>Homepage RGM</h1>
      <div>
        <Link to="/dimensions" className="homeButton">
          Start
        </Link>
      </div>
    </div>
  );
}
export default HomePage;
