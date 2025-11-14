import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  return (
    <div className="homeContainer">
      {/* Full-width title box */}
      <section className="heroSection">
        <img
          src="/shuffle-logo.svg"
          alt="Shuffle Logo"
          className="heroLogo"
        />

        <h1 className="heroTitle">RGM-Prüfwerkzeug</h1>

        {/* Optional short tagline below title */}
        <p className="heroSubtitle">
          Ein Werkzeug zur systematischen Erfassung und Weiterentwicklung
          des digitalen Reifegrads Ihrer Einrichtung.
        </p>

        <Link to="/dimensions" className="homeButton">
          Start
        </Link>
      </section>

      {/* Two-column content below (intro + project info) */}
      <section className="contentRow">
        {/* Left: Intro text */}
        <div className="bottomLeftText">
          <h2>Willkommen!</h2>
          <p>
            Dieses Werkzeug unterstützt Einrichtungen dabei,
            ihren digitalen Reifegrad systematisch zu erfassen
            und gezielt weiterzuentwickeln.
          </p>
          <p>
            Durch die Beantwortung der Fragen in den
            unterschiedlichen Dimensionen entsteht ein
            individuelles Profil, das als Grundlage für
            strategische Entwicklungsprozesse dient.
          </p>
        </div>

        {/* Right: Project info as description list */}
        <div className="bottomRightInfo">
          <h3>Projektinformationen</h3>

          <dl className="infoList">
            <dt>Entwickelt:</dt>
            <dd>2022–2025</dd>

            <dt>Gefördert von:</dt>
            <dd>Stiftung Innovation in der Hochschullehre</dd>

            <dt>Projektpartner:</dt>
            <dd>Hochschule der Medien Stuttgart</dd>
          </dl>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
