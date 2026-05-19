import React from "react";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="homePage">
      <section className="homeHero" aria-labelledby="home-title">
        <div className="homeHeroInner">
          <img
            src="/shuffle-logo.svg"
            alt="Shuffle Logo"
            className="heroLogo"
          />

          <h1 id="home-title" className="homeTitle">
            SHUFFLE-RGM-Prüfwerkzeug
          </h1>

          <p className="homeLead">
            Dieses Prüfwerkzeug dient der Selbstbewertung des Reifegrads der digitalen Barrierefreiheit an Ihrer Hochschule. Über den folgenden Button erreichen Sie den Fragebogen, den Sie direkt online ausfüllen können. Alternativ steht Ihnen eine Bewertungsmatrix zum Download zur Verfügung, mit der die Selbstbewertung offline durchgeführt werden kann.</p>

          <div className="homeHeroActions">
            <Link to="/dimensions" className="homeButton">
              Direkt zum Fragebogen
            </Link>
          </div>
        </div>
      </section>

      <section className="homeContent" aria-labelledby="welcome-title">
        <div className="homeGrid">
          <article className="homeIntroCard">
            <h2 id="welcome-title">Willkommen!</h2>
            <p>
              Das SHUFFLE-Reifegradmodell ist ein Unterstützungstool
              zur Verbesserung der digitalen Barrierefreiheit an Hochschulen.
              Es hilft Verantwortlichen, relevante Daten strukturiert zu erheben
              und zu bündeln.
              <br />
              Durch die Beantwortung der Fragen in den
              unterschiedlichen Dimensionen
              ("Beratung und Support", "Lehren und Lernen", "Strategie" und "Struktur")
              entsteht ein individuelles Profil, das als Grundlage für
              strategische Entwicklungsprozesse dient.
              <br />
              Mithilfe des fünfstufigen Modells können sich Hochschulen
              einen Überblick über den Stand ihrer digitalen Barrierefreiheit verschaffen.
              Das Reifegradmodell unterstützt dann bei dessen systematischen Ausbau,
              indem es Optimierungspotentiale aufzeigt und
              konkrete Handlungsempfehlungen dafür gibt.
            </p>
          </article>

          <aside className="infoCard infoCardAccent" aria-labelledby="project-info-title">
            <h3 id="project-info-title">Projektinformationen</h3>

            <dl className="infoList">
              <dt>Entwickelt:</dt>
              <dd>2021–2025</dd>

              <dt>Gefördert von:</dt>
              <dd>Stiftung Innovation in der Hochschullehre</dd>

              <dt>Projektpartner:</dt>
              <dd>Hochschule der Medien Stuttgart</dd>
              <dd>Universität Bielefeld</dd>
              <dd>Pädagogische Hochschule Heidelberg</dd>
              <dd>Pädagogische Hochschule Freiburg</dd>
            </dl>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
